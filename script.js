// Wait for DOM to be fully loaded before executing script
document.addEventListener('DOMContentLoaded', function() {
    // User data (in a real application this should be on the server)
    const users = {
        "admin": { password: "admin", type: "admin" },
        "user": { password: "password", type: "user" }
    };

    // Registration key (in a real application this should be on the server)
    const validRegistrationKeys = ["mchskey123", "emergency2025"];

    // Map variables
    let map;
    let userMarker = null;
    let markersLayer = null;
    let currentMode = "view"; // view, add, delete

    // Cache DOM elements
    const elements = {
        authContainer: document.getElementById("auth-container"),
        loginTab: document.getElementById("login-tab"),
        registerTab: document.getElementById("register-tab"),
        loginDiv: document.getElementById("login"),
        registerDiv: document.getElementById("register"),
        mapDiv: document.getElementById("map"),
        appTitle: document.querySelector("h1"),
        
        // Login elements
        usernameInput: document.getElementById("username"),
        passwordInput: document.getElementById("password"),
        loginErrorText: document.getElementById("login-error"),
        loginButton: document.getElementById("login-button"),
        
        // Registration elements
        newUsernameInput: document.getElementById("new-username"),
        newPasswordInput: document.getElementById("new-password"),
        confirmPasswordInput: document.getElementById("confirm-password"),
        specialKeyInput: document.getElementById("special-key"),
        registerErrorText: document.getElementById("register-error"),
        registerButton: document.getElementById("register-button"),
        
        // Map elements
        updateLocationButton: document.getElementById("update-location"),
        logoutButton: document.getElementById("logout"),
        loadingIndicator: document.querySelector(".loading"),
        markerPanel: document.getElementById("marker-panel"),
        addMarkerModeBtn: document.getElementById("add-marker-mode"),
        deleteMarkerModeBtn: document.getElementById("delete-marker-mode"),
        viewMarkerModeBtn: document.getElementById("view-marker-mode"),
        currentModeText: document.getElementById("current-mode")
    };

    // Check if all required elements are available
    const missingElements = Object.entries(elements)
        .filter(([_, element]) => !element)
        .map(([name]) => name);

    if (missingElements.length > 0) {
        console.error("Missing DOM elements:", missingElements);
        return; // Exit if required elements are missing
    }

    // Setup auth tabs
    function setupAuthTabs() {
        // Show login form by default
        elements.loginDiv.style.display = "block";
        elements.registerDiv.style.display = "none";
        
        // Login tab click
        elements.loginTab.addEventListener("click", function() {
            elements.loginTab.classList.add("active");
            elements.registerTab.classList.remove("active");
            elements.loginDiv.style.display = "block";
            elements.registerDiv.style.display = "none";
            clearErrors();
        });
        
        // Register tab click
        elements.registerTab.addEventListener("click", function() {
            elements.registerTab.classList.add("active");
            elements.loginTab.classList.remove("active");
            elements.registerDiv.style.display = "block";
            elements.loginDiv.style.display = "none";
            clearErrors();
        });
    }

    // Clear error messages
    function clearErrors() {
        elements.loginErrorText.innerText = "";
        elements.registerErrorText.innerText = "";
    }

    // Login functionality
    function setupLogin() {
        // Enter key for login
        elements.passwordInput.addEventListener("keyup", function(event) {
            if (event.key === "Enter") {
                elements.loginButton.click();
            }
        });

        // Login button click
        elements.loginButton.addEventListener("click", function() {
            const username = elements.usernameInput.value.trim();
            const password = elements.passwordInput.value;
            
            if (!username || !password) {
                elements.loginErrorText.innerText = "Пожалуйста, введите логин и пароль";
                return;
            }
            
            // Check in localStorage for user data
            let storedUsers = JSON.parse(localStorage.getItem("registeredUsers") || "{}");
            
            if (users[username] && users[username].password === password) {
                // Built-in users (admin, user)
                processSuccessfulLogin(users[username].type);
            } else if (storedUsers[username] && storedUsers[username].password === password) {
                // Registered users from localStorage
                processSuccessfulLogin(storedUsers[username].type || "user");
            } else {
                elements.loginErrorText.innerText = "Неверный логин или пароль";
                elements.passwordInput.value = "";
            }
        });
    }

    // Process successful login
    function processSuccessfulLogin(userType) {
        showLoading();
        
        // Save user info to localStorage
        localStorage.setItem("userType", userType);
        localStorage.setItem("loggedIn", "true");
        
        // Show map interface
        showMapInterface(userType);
        
        hideLoading();
    }

    // Registration functionality
    function setupRegistration() {
        // Enter key for registration
        elements.specialKeyInput.addEventListener("keyup", function(event) {
            if (event.key === "Enter") {
                elements.registerButton.click();
            }
        });

        // Registration button click
        elements.registerButton.addEventListener("click", function() {
            const newUsername = elements.newUsernameInput.value.trim();
            const newPassword = elements.newPasswordInput.value;
            const confirmPassword = elements.confirmPasswordInput.value;
            const specialKey = elements.specialKeyInput.value.trim();
            
            // Basic validation
            if (!newUsername || !newPassword || !confirmPassword || !specialKey) {
                elements.registerErrorText.innerText = "Пожалуйста, заполните все поля";
                return;
            }
            
            if (newPassword !== confirmPassword) {
                elements.registerErrorText.innerText = "Пароли не совпадают";
                return;
            }
            
            if (newUsername.length < 3) {
                elements.registerErrorText.innerText = "Логин должен содержать минимум 3 символа";
                return;
            }
            
            if (newPassword.length < 6) {
                elements.registerErrorText.innerText = "Пароль должен содержать минимум 6 символов";
                return;
            }
            
            // Check if special key is valid
            if (!validRegistrationKeys.includes(specialKey)) {
                elements.registerErrorText.innerText = "Неверный специальный ключ";
                return;
            }
            
            // Check if username already exists
            if (users[newUsername]) {
                elements.registerErrorText.innerText = "Пользователь с таким логином уже существует";
                return;
            }
            
            // Get existing registered users
            let storedUsers = JSON.parse(localStorage.getItem("registeredUsers") || "{}");
            
            // Check if username exists in stored users
            if (storedUsers[newUsername]) {
                elements.registerErrorText.innerText = "Пользователь с таким логином уже существует";
                return;
            }
            
            // Add new user to stored users
            storedUsers[newUsername] = {
                password: newPassword,
                type: "user", // Default to regular user
                registrationDate: new Date().toISOString()
            };
            
            // Save updated users to localStorage
            localStorage.setItem("registeredUsers", JSON.stringify(storedUsers));
            
            // Show success notification
            showNotification("Регистрация успешно завершена! Теперь вы можете войти", "success");
            
            // Switch to login tab
            elements.loginTab.click();
            
            // Pre-fill login form
            elements.usernameInput.value = newUsername;
            elements.passwordInput.value = "";
            elements.passwordInput.focus();
        });
    }

    // Logout functionality
    function setupLogout() {
        elements.logoutButton.addEventListener("click", function() {
            localStorage.removeItem("userType");
            localStorage.removeItem("loggedIn");
            
            // Show login interface
            elements.mapDiv.style.display = "none";
            elements.logoutButton.style.display = "none";
            elements.updateLocationButton.style.display = "none";
            elements.markerPanel.style.display = "none";
            elements.authContainer.style.display = "block";
            elements.appTitle.style.display = "block";
            
            // Clear input fields
            elements.usernameInput.value = "";
            elements.passwordInput.value = "";
            elements.loginErrorText.innerText = "";
            
            // Clear registration fields
            elements.newUsernameInput.value = "";
            elements.newPasswordInput.value = "";
            elements.confirmPasswordInput.value = "";
            elements.specialKeyInput.value = "";
            elements.registerErrorText.innerText = "";
            
            // Remove map if it exists
            if (map) {
                map.remove();
                map = null;
            }
        });
    }

    // Show map interface
    function showMapInterface(userType) {
        elements.authContainer.style.display = "none";
        elements.appTitle.style.display = "none";
        elements.mapDiv.style.display = "block";
        elements.logoutButton.style.display = "block";
        elements.updateLocationButton.style.display = "flex";
        
        // Show marker panel only for admin users
        elements.markerPanel.style.display = userType === "admin" ? "block" : "none";
        
        // Initialize map
        initMap(userType);
    }

    // Map initialization
    function initMap(userType) {
        try {
            // Initialize map if it doesn't exist
            if (!map) {
                // Ensure map container has proper dimensions
                elements.mapDiv.style.width = '100%';
                elements.mapDiv.style.height = '100%';
                
                map = L.map('map', {
                    center: [55.751244, 37.618423], // Moscow default
                    zoom: 10,
                    minZoom: 2,
                    maxZoom: 18,
                    worldCopyJump: true,
                    zoomControl: false
                });

                // Add zoom controls on the right
                L.control.zoom({
                    position: 'topright'
                }).addTo(map);

                // Add OpenStreetMap layer
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors',
                    noWrap: false
                }).addTo(map);

                // Set map boundaries
                map.setMaxBounds([
                    [-90, -Infinity],
                    [90, Infinity]
                ]);

                // Create layer group for markers
                markersLayer = L.layerGroup().addTo(map);
                
                // Fix map rendering
                setTimeout(function() {
                    map.invalidateSize();
                }, 100);
            }
            
            // Load saved markers
            loadMarkers();
            
            // Setup marker modes for admin
            setupMarkerModes(userType);
            
            // Get user location
            getUserLocation();
        } catch (error) {
            console.error("Error initializing map:", error);
            showNotification("Ошибка при инициализации карты", "error");
        }
    }

    // Setup marker modes
    function setupMarkerModes(userType) {
        if (userType === "admin") {
            elements.markerPanel.style.display = "block";
            
            // Mode button event handlers
            elements.addMarkerModeBtn.addEventListener("click", function() {
                setMarkerMode("add");
            });
            
            elements.deleteMarkerModeBtn.addEventListener("click", function() {
                setMarkerMode("delete");
            });
            
            elements.viewMarkerModeBtn.addEventListener("click", function() {
                setMarkerMode("view");
            });
            
            // Map click handler
            map.on('click', handleMapClick);
        } else {
            elements.markerPanel.style.display = "none";
        }
    }

    // Set current marker mode
    function setMarkerMode(mode) {
        currentMode = mode;
        
        // Remove active class from all buttons
        elements.addMarkerModeBtn.classList.remove("active");
        elements.deleteMarkerModeBtn.classList.remove("active");
        elements.viewMarkerModeBtn.classList.remove("active");
        
        // Add active class to the selected button
        if (mode === "add") {
            elements.addMarkerModeBtn.classList.add("active");
            elements.currentModeText.innerText = "Текущий режим: Добавление";
            map.getContainer().style.cursor = "crosshair";
        } else if (mode === "delete") {
            elements.deleteMarkerModeBtn.classList.add("active");
            elements.currentModeText.innerText = "Текущий режим: Удаление";
            map.getContainer().style.cursor = "pointer";
        } else {
            elements.viewMarkerModeBtn.classList.add("active");
            elements.currentModeText.innerText = "Текущий режим: Просмотр";
            map.getContainer().style.cursor = "";
        }
    }

    // Handle map click
    function handleMapClick(e) {
        if (currentMode === "add") {
            var name = prompt("Введите название объекта или описание:");
            if (name && name.trim()) {
                try {
                    const marker = L.marker(e.latlng).addTo(markersLayer);
                    marker.bindPopup(name);
                    marker.openPopup();
                    
                    // Save marker
                    saveMarker(e.latlng, name);
                    
                    // Add click handler for deletion
                    marker.on('click', function() {
                        if (currentMode === "delete") {
                            if (confirm(`Удалить маркер "${name}"?`)) {
                                deleteMarker(e.latlng);
                                markersLayer.removeLayer(marker);
                            }
                        }
                    });
                } catch (error) {
                    console.error("Error adding marker:", error);
                    showNotification("Ошибка при добавлении маркера", "error");
                }
            }
        }
    }

    // Update user location
    function setupLocationUpdate() {
        elements.updateLocationButton.addEventListener("click", function() {
            getUserLocation();
        });
    }

    // Get user location
    function getUserLocation() {
        showLoading();
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    try {
                        const userLocation = [position.coords.latitude, position.coords.longitude];
                        
                        // Remove previous user marker
                        if (userMarker && map) {
                            map.removeLayer(userMarker);
                        }
                        
                        // Create new user marker with pulsing effect
                        userMarker = L.marker(userLocation, {
                            icon: L.divIcon({
                                html: '<div class="pulse-marker"><div class="pulse-core"></div><div class="pulse-wave"></div></div>',
                                className: 'user-location-marker',
                                iconSize: [20, 20],
                                iconAnchor: [10, 10]
                            })
                        }).addTo(map);
                        
                        userMarker.bindPopup("Ваше местоположение").openPopup();
                        map.setView(userLocation, 14);
                        
                        showNotification("Местоположение успешно обновлено", "success");
                    } catch (error) {
                        console.error("Error setting user location:", error);
                        showNotification("Ошибка при установке местоположения", "error");
                    } finally {
                        hideLoading();
                    }
                },
                function(error) {
                    console.error("Geolocation error:", error);
                    hideLoading();
                    
                    let errorMessage;
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = "Доступ к определению местоположения отклонен";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = "Информация о местоположении недоступна";
                            break;
                        case error.TIMEOUT:
                            errorMessage = "Истекло время ожидания запроса на определение местоположения";
                            break;
                        default:
                            errorMessage = "Произошла неизвестная ошибка при определении местоположения";
                    }
                    
                    showNotification(errorMessage, "error");
                    
                    // If no location, use default location
                    if (map && !userMarker) {
                        const defaultLocation = [55.751244, 37.618423]; // Moscow
                        map.setView(defaultLocation, 10);
                    }
                },
                { 
                    timeout: 10000,
                    maximumAge: 0,
                    enableHighAccuracy: true 
                }
            );
        } else {
            hideLoading();
            showNotification("Геолокация не поддерживается вашим браузером", "error");
            
            // If no geolocation support, use default location
            if (map) {
                const defaultLocation = [55.751244, 37.618423]; // Moscow
                map.setView(defaultLocation, 10);
            }
        }
    }

    // Load markers from localStorage
    function loadMarkers() {
        try {
            const markers = JSON.parse(localStorage.getItem('markers') || '[]');
            
            // Clear markers layer before loading
            markersLayer.clearLayers();
            
            markers.forEach(markerData => {
                try {
                    // Create LatLng object for marker - handle both formats
                    let lat, lng;
                    
                    if (typeof markerData.latlng === 'object') {
                        if (Array.isArray(markerData.latlng)) {
                            // Handle array format [lat, lng]
                            lat = markerData.latlng[0];
                            lng = markerData.latlng[1];
                        } else {
                            // Handle object format {lat, lng}
                            lat = markerData.latlng.lat;
                            lng = markerData.latlng.lng;
                        }
                    } else {
                        // Skip invalid marker data
                        console.error("Invalid marker data format:", markerData);
                        return;
                    }
                    
                    const latlng = L.latLng(lat, lng);
                    const marker = L.marker(latlng).addTo(markersLayer);
                    marker.bindPopup(markerData.name || "Без названия");
                    
                    // Add click handler for deletion if admin
                    marker.on('click', function() {
                        if (currentMode === "delete") {
                            if (confirm(`Удалить маркер "${markerData.name || "Без названия"}"?`)) {
                                deleteMarker(latlng);
                                markersLayer.removeLayer(marker);
                            }
                        }
                    });
                } catch (error) {
                    console.error("Error creating marker:", error);
                }
            });
        } catch (error) {
            console.error("Error loading markers:", error);
            showNotification("Ошибка при загрузке меток", "error");
        }
    }

    // Save marker to localStorage
    function saveMarker(latlng, name) {
        try {
            // Get existing markers
            const markers = JSON.parse(localStorage.getItem('markers') || '[]');
            
            // Add new marker
            markers.push({
                latlng: {
                    lat: latlng.lat,
                    lng: latlng.lng
                },
                name: name,
                timestamp: new Date().toISOString()
            });
            
            // Save markers
            localStorage.setItem('markers', JSON.stringify(markers));
            
            showNotification("Метка успешно сохранена", "success");
        } catch (error) {
            console.error("Error saving marker:", error);
            showNotification("Ошибка при сохранении метки", "error");
        }
    }

    // Delete marker from localStorage
    function deleteMarker(latlng) {
        try {
            // Get existing markers
            const markers = JSON.parse(localStorage.getItem('markers') || '[]');
            
            // Filter out the deleted marker
            const filteredMarkers = markers.filter(marker => {
                // Handle array format [lat, lng]
                if (Array.isArray(marker.latlng)) {
                    return marker.latlng[0] !== latlng.lat || marker.latlng[1] !== latlng.lng;
                }
                // Handle object format {lat, lng}
                return marker.latlng.lat !== latlng.lat || marker.latlng.lng !== latlng.lng;
            });
            
            // Save remaining markers
            localStorage.setItem('markers', JSON.stringify(filteredMarkers));
            
            showNotification("Метка успешно удалена", "success");
        } catch (error) {
            console.error("Error deleting marker:", error);
            showNotification("Ошибка при удалении метки", "error");
        }
    }

    // Show loading indicator
    function showLoading() {
        elements.loadingIndicator.style.display = "flex";
    }

    // Hide loading indicator
    function hideLoading() {
        elements.loadingIndicator.style.display = "none";
    }

    // Show notification
    function showNotification(message, type) {
        // Remove any existing notification
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // Create new notification
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = message;
        
        // Add to body
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        // Hide notification after 3 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            
            // Remove from DOM after animation completes
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 3000);
    }

    // Check if user is already logged in
    function checkLoggedInStatus() {
        const loggedIn = localStorage.getItem('loggedIn') === 'true';
        const userType = localStorage.getItem('userType');
        
        if (loggedIn && userType) {
            showMapInterface(userType);
        }
    }

    // Initialize app
    function init() {
        setupAuthTabs();
        setupLogin();
        setupRegistration();
        setupLogout();
        setupLocationUpdate();
        checkLoggedInStatus();
    }

    // Start the app
    init();
});