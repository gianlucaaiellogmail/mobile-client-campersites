
// Inizializzazione
var localeApp = 'en';
var version = '5.1.0';

angular.module('campersites', ['ionic', 'ngMessages', 'ngStorage', 'pascalprecht.translate', 'angucomplete-alt', 'leaflet-directive']);

// Run
angular.element(document).ready(function() {
	document.addEventListener("deviceready", function() {
		angular.bootstrap(document, ["campersites"]);
	}, false);
});
angular.module('campersites').run(function($ionicPlatform, $http, $ionicHistory, $window, $rootScope, $ionicPopup, $ionicLoading) {
	if (device.platform != 'Win32NT' && window.cordova && window.cordova.plugins.Keyboard) {
		cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
	}
	if (window.StatusBar && device.platform === 'Win32NT') {
		// org.apache.cordova.statusbar required
		StatusBar.hide();
		$ionicPlatform.isFullScreen = true;
	}
	// Init Database
	var db = $window.sqlitePlugin.openDatabase({name: 'CamperSites.info', iosDatabaseLocation: 'Library'});
	db.transaction(function(tx) {
        tx.executeSql('CREATE TABLE IF NOT EXISTS stop_points (stop_id INTEGER PRIMARY KEY, latitude, longitude, latitude_deg, longitude_deg, type_id, inserted, inserted_by_user, modified, modified_by_user, description, tot_preferito, rating, foto_path, homepage, valuta, prezzo_notturno, prezzo_orario, prezzo_giornaliero, prezzo_settimanale, prezzo_particolare, acqua, scarico_cassetta, scarico_pozzetto, prezzo_service, tipo_piazzola, corrente, prezzo_corrente, custodito, videosorveglianza, notte, illuminazione, ombra, docce, bagni, bambini, picnic, animali, fermata, wifi, locality, nation, telefono, posti, max_hh, chiusura, distance)');
        tx.executeSql('CREATE UNIQUE INDEX IF NOT EXISTS stop_points_latlong ON stop_points (latitude, longitude)');
        tx.executeSql('CREATE INDEX IF NOT EXISTS stop_points_description ON stop_points (description)');
        tx.executeSql('CREATE INDEX IF NOT EXISTS stop_points_locality ON stop_points (locality)');
        tx.executeSql('CREATE TABLE IF NOT EXISTS users_preferiti (stop_id INTEGER, user_id INTEGER, modified, PRIMARY KEY (stop_id, user_id))');
        tx.executeSql('CREATE TABLE IF NOT EXISTS user_pois (poi_id INTEGER PRIMARY KEY, longitude, latitude, user_id INTEGER, inserted, name, description, icon)');
        tx.executeSql('CREATE TABLE IF NOT EXISTS downloads (nation PRIMARY KEY, data_aggiornamento)');
        tx.executeSql('CREATE TABLE IF NOT EXISTS users_reviews (stop_id INTEGER, user_id INTEGER, rating, review, modified, PRIMARY KEY (stop_id, user_id))');
        tx.executeSql('CREATE TABLE IF NOT EXISTS offline_events (stop_id INTEGER, user_id INTEGER, func, rating, review, modified, PRIMARY KEY (stop_id, user_id, func))');
	}, function (err) {
		$ionicPopup.alert({
			template: err.code + ": " + err.message
		});
    });	
    $rootScope.db = db;
    var dbTiles = $window.sqlitePlugin.openDatabase({name: 'CamperSitesTiles.info', iosDatabaseLocation: 'Library'});
    dbTiles.transaction(function(tx) {
        dbTiles.executeSql('PRAGMA auto_vacuum = 1;', []);
        tx.executeSql('CREATE TABLE IF NOT EXISTS tiles (zoom_level INTEGER, tile_column INTEGER, tile_row INTEGER, tile_data BLOB, tile_nations TEXT)');
        tx.executeSql('CREATE UNIQUE INDEX IF NOT EXISTS tiles_index ON tiles (zoom_level, tile_column, tile_row)');
        tx.executeSql('CREATE TABLE IF NOT EXISTS infotiles (zoom_level INTEGER, min_tile_column INTEGER, max_tile_column INTEGER, min_tile_row INTEGER, max_tile_row INTEGER, tile_nation TEXT)');
        tx.executeSql('CREATE UNIQUE INDEX IF NOT EXISTS infotiles_index ON infotiles (zoom_level, min_tile_column, max_tile_column, min_tile_row, max_tile_row)');
	}, function (err) {
		$ionicPopup.alert({
			template: err.code + ": " + err.message
		});
    });	
    $rootScope.dbTiles = dbTiles;
	// TODO delete old file maps
    $ionicPlatform.onHardwareBackButton(function() {
		$ionicLoading.hide();
		$ionicHistory.goBack();
	});

    ga_storage._setAccount('UA-114508-10');
    ga_storage._setDomain('campersites.info');
});

// Configurazione, Traduzioni, Stati e Navigazione
angular.module('campersites').config(function($translateProvider, $compileProvider, $stateProvider, $urlRouterProvider, $ionicConfigProvider, $locationProvider) {
	openFB.init({appId: '233180500170599'});
	
	$compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|file|tel|mailto|ghttps?|ms-appx|x-wmapp0):/);
	$compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|file|ftp|mailto|content|ms-appx|x-wmapp0):/);

	if (device.platform === 'Win32NT') {
		$locationProvider.html5Mode(false);
	}
	
	$translateProvider
	.useStaticFilesLoader({
		prefix: 'locales/locale-',
		suffix: '.json'
	})
	.registerAvailableLanguageKeys(['it', 'en', 'fr'], {
		'en_US': 'en',
		'en_UK': 'en',
		'fr_FR': 'fr',
		'fr_BE': 'fr',
		'fr_CH': 'fr',
		'it_IT': 'it',
		'it_CH': 'it'
	})
	.fallbackLanguage('en')
	.determinePreferredLanguage();
	if (angular.isString(getFirstBrowserLanguage())) {
		localeApp = getFirstBrowserLanguage().toLocaleLowerCase().substring(0, 2);
	    ga_storage._setUtmul(getFirstBrowserLanguage().toLocaleLowerCase());
	}

	$stateProvider
	.state('index', {
		url: '/',
		templateUrl: 'templates/home.html',
		controller: 'homeController'
	})
	.state('login', {
		url: '/login',
		templateUrl: 'templates/login.html',
		controller: 'loginController'
	})
	.state('signup', {
		url: '/signup',
		templateUrl: 'templates/signup.html',
		controller: 'signupController'
	})
	.state('settings', {
		url: '/settings',
		templateUrl: 'templates/settings.html',
		controller: 'settingsController'
	})
	.state('downloads', {
		url: '/downloads',
		params: {
			nations: [],
			nationsMap: []
		},
		templateUrl: 'templates/downloads.html',
		controller: 'downloadsController'
	})
	.state('user', {
		url: '/user',
		templateUrl: 'templates/user.html',
		controller: 'userController'
	})
	.state('favorites', {
		url: '/favorites',
		params: {
			stopPoints: []
		},
		templateUrl: 'templates/favorites.html',
		controller: 'favoritesController'
	})
	.state('searched', {
		url: '/searched',
		params: {
			stopPoints: []
		},
		templateUrl: 'templates/searched.html',
		controller: 'searchedController'
	})
	.state('detail', {
		url: '/detail',
		params: {
			stopPoint: null,
			preferito: false,
			howRated: null
		},
		templateUrl: 'templates/detail.html',
		controller: 'detailController'
	})
	.state('review', {
		url: '/review',
		params: {
			stopId: null
		},
		templateUrl: 'templates/review.html',
		controller: 'reviewController'
	})
	.state('modifyArea', {
		url: '/modifyArea',
		params: {
			stopPoint: null,
			preferito: false,
			howRated: null
		},
		templateUrl: 'templates/modifyArea.html',
		controller: 'modifyAreaController'
	});
	$urlRouterProvider.otherwise('/');
});

// Controllers
angular.module('campersites').controller('homeController', function($scope, $rootScope, $state, $http, $ionicLoading, $ionicPopup, $localStorage, $translate, rilevaPosizione, getStopPointsService, syncUserData, sharingPosition) {
	$scope.$storage = $localStorage;
    if ($scope.$storage.distanza == null || $scope.$storage.distanza === undefined) {
    	$scope.$storage.distanza = '20';
    }
    if ($scope.$storage.mapsSetting == null || $scope.$storage.mapsSetting === undefined) {
    	$scope.$storage.mapsSetting = 1;
    }
    if ($scope.$storage.sharePosition == null || $scope.$storage.sharePosition === undefined) {
    	$scope.$storage.sharePosition = 1;
    }
    if ($scope.$storage.navigatore == null || $scope.$storage.navigatore === undefined) {
    	$scope.$storage.navigatore = 'Altro';
    }
    if ($scope.$storage.nations == null || $scope.$storage.nations === undefined) {
    	$scope.$storage.nations = [];
    }
    if ($scope.$storage.nationsMap == null || $scope.$storage.nationsMap === undefined) {
    	$scope.$storage.nationsMap = [];
    }
    if ($scope.$storage.apprate == null || $scope.$storage.apprate === undefined) {
    	$scope.$storage.apprate = [];
    }
    if ($scope.$storage.apprate[version] == null || $scope.$storage.apprate[version] === undefined) {
    	$scope.$storage.apprate[version] = {};
    	$scope.$storage.apprate[version].enabled = 1;
    	$scope.$storage.apprate[version].countOpens = 1;
    }
	$translate(['error.errore', 'error.server', 'error.connessione', 'error.database', 'error.gps', 'label.posizionando', 'label.apprate_text', 'label.apprate_agree', 'label.apprate_remind', 'label.apprate_decline']).then(function (translations) {
		$scope.errore = translations['error.errore'];
		$scope.error_server = translations['error.server'];
		$scope.error_connessione = translations['error.connessione'];
		$scope.error_database = translations['error.database'];
		$scope.error_gps = translations['error.gps'];
		$scope.label_posizionando = translations['label.posizionando'];
		$rootScope.label_apprate_text = translations['label.apprate_text'];
		$rootScope.label_apprate_agree = translations['label.apprate_agree'];
		$rootScope.label_apprate_remind = translations['label.apprate_remind'];
		$rootScope.label_apprate_decline = translations['label.apprate_decline'];
	});
	$scope.photos = [
		'img/photo/Italia/beautiful_houses-wallpaper-960x540.jpg',
		'img/photo/Francia/camargue-wallpaper-960x540.jpg',
		'img/photo/Germania/cologne_at_night-wallpaper-960x540.jpg',
		'img/photo/Olanda/aerial_view_of_tulip_flower_fields_amsterdam_the_netherlands-wallpaper-960x540.jpg',
		'img/photo/Norvegia/alesund_norway_harbor-wallpaper-960x540.jpg',
		'img/photo/Italia/cloudy_colosseum-wallpaper-960x540.jpg',
		'img/photo/Francia/champagne_ardenne_scenery-wallpaper-960x540.jpg',
		'img/photo/Germania/ferris_wheel_2-wallpaper-960x540.jpg',
		'img/photo/Austria/kitzbuhel_mountain_view_austria_europe-wallpaper-960x540.jpg',
		'img/photo/Belgio/the_groenerei_canal_in_bruges_belgium-wallpaper-960x540.jpg',
		'img/photo/Croazia/sunset_zadar_croatia_8-wallpaper-960x540.jpg',
		'img/photo/Danimarca/blavand_oksby_denmark-wallpaper-960x540.jpg',
		'img/photo/Olanda/bridge_in_holland-wallpaper-960x540.jpg',
		'img/photo/Norvegia/geiranger_norway-wallpaper-960x540.jpg',
		'img/photo/Italia/italian_landscape_2-wallpaper-960x540.jpg',
		'img/photo/Francia/chateau_de_chenonceau-wallpaper-960x540.jpg',
		'img/photo/Germania/hohenzollern_castle_fog_germany-wallpaper-960x540.jpg',
		'img/photo/Slovenia/castle_on_a_island-wallpaper-960x540.jpg',
		'img/photo/Svezia/stockholm_sweden_europe-wallpaper-960x540.jpg',
		'img/photo/Svizzera/chapel_bridge_lucerne_switzerland-wallpaper-960x540.jpg',
		'img/photo/Italia/landro_lake_alta_pusteria_bolzano_district_italy-wallpaper-960x540.jpg',
		'img/photo/Francia/kaysersberg_france-wallpaper-960x540.jpg',
		'img/photo/Germania/karwendel_bavaria_germany-wallpaper-960x540.jpg',
		'img/photo/Olanda/canal_cruiser_amsterdam-wallpaper-960x540.jpg',
		'img/photo/Norvegia/norway_scenery-wallpaper-960x540.jpg',
		'img/photo/Italia/piazza_san_pietro-wallpaper-960x540.jpg',
		'img/photo/Francia/mont_saint_michel_normandy_france-wallpaper-960x540.jpg',
		'img/photo/Germania/neuschwanstein_castle_2-wallpaper-960x540.jpg',
		'img/photo/Olanda/holland_canal-wallpaper-960x540.jpg',
		'img/photo/Italia/venice-wallpaper-960x540.jpg',
		'img/photo/Francia/travel_paris-wallpaper-960x540.jpg',
		'img/photo/Germania/st__bartholomews_church_berchtesgaden_germany-wallpaper-960x540.jpg',
		'img/photo/Italia/villa_deste-wallpaper-960x540.jpg'
	];
	$scope.shuffleArray = function(array) {
		var m = array.length, t, i;
		// While there remain elements to shuffle
		while (m) {
			// Pick a remaining element�
			i = Math.floor(Math.random() * m--);
		    // And swap it with the current element.
		    t = array[m];
		    array[m] = array[i];
		    array[i] = t;
		}
		return array;
	};
	$scope.shuffledPhotos = $scope.shuffleArray($scope.photos);
	$scope.getBackground = function() {
		return "background-image: url("+$scope.shuffledPhotos[0]+")";
	};
	$scope.goLogin = function() {
		$state.go('login');
	};
	$scope.goSettings = function() {
		$state.go('settings');
	};
	$scope.goUtente = function() {
		$state.go('user');
	};
	$scope.goDownloads = function() {
		if (isOnline()) {
			$ionicLoading.show({hideOnStateChange: true});
			$http({
			    method: 'GET',
			    url: 'http://www.campersites.info/getMobileNationStats'
			}).
			success(function(data, status) {
        		angular.forEach(data, function(remoteNation, i) {
        			angular.forEach($scope.$storage.nations, function(localNation, j) {
	        			if (remoteNation.nation === localNation.nation) {
	        				remoteNation.lastAreeDownload = localNation.lastAreeDownload;
	    				}
        			});
    			});
        		if (isOnline()) {
        			$ionicLoading.show({hideOnStateChange: true});
        			$http({
        			    method: 'GET',
        			    url: 'http://www.campersites.info/downloadDbMaps'
        			}).
        			success(function(dataMap, status) {
                		angular.forEach(dataMap, function(remoteNationMap, i) {
                			angular.forEach($scope.$storage.nationsMap, function(localNation, j) {
        	        			if (remoteNationMap.nation === localNation.nation) {
        	        				remoteNationMap.lastMappeDownload = localNation.lastMappeDownload;
        	    				}
                			});
                			remoteNationMap.filedate = dateFormat(remoteNationMap.filedate);
            			});
        				$state.go('downloads', {nations: data, nationsMap: dataMap});
        			}).
        			error(function(data, status) {
        				$ionicLoading.hide();
        				$ionicPopup.alert({
        					title: $scope.errore,
        					template: $scope.error_server
        				});
        			});
        		} else {
        			$ionicPopup.alert({
        				title: $scope.errore,
        				template: $scope.error_connessione
        			});
        		}
			}).
			error(function(data, status) {
				$ionicLoading.hide();
				$ionicPopup.alert({
					title: $scope.errore,
					template: $scope.error_server
				});
			});
		} else {
			$ionicPopup.alert({
				title: $scope.errore,
				template: $scope.error_connessione
			});
		}
	};
	$scope.stopPoints = [];
	$scope.goCercaVicino = function() {
		$ionicLoading.show({hideOnStateChange: true, template: '<p><ion-spinner></ion-spinner></p><p>'+$scope.label_posizionando+'</p>'});
		rilevaPosizione.exec().then(function(position) {
			$ionicLoading.show({hideOnStateChange: true});
			getStopPointsService.getByLatLang({latitude: position.coords.latitude, longitude: position.coords.longitude}).then(function(stopPointsList) {
				$state.go('searched', {stopPoints: stopPointsList});
			}, function(err) {
				$ionicLoading.hide();
				$ionicPopup.alert({
					title: $scope.errore,
					template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
				});
			});
		}, function (err) {
			$ionicLoading.hide();
			$ionicPopup.alert({
				title: $scope.errore,
				template: $scope.error_gps
			});
		});
	};
	$scope.doSearch = function(value) {
		if (value != undefined) {
			$ionicLoading.show({hideOnStateChange: true});
			getStopPointsService.getByLatLang({latitude: value.originalObject.latitude, longitude: value.originalObject.longitude}).then(function(stopPointsList) {
				$state.go('searched', {stopPoints: stopPointsList});
			}, function(err) {
				$ionicLoading.hide();
				$ionicPopup.alert({
					title: $scope.errore,
					template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
				});
			});
		}
	};
	$scope.db = $rootScope.db;
	$scope.searchStopPoints = function(q) {
		if (q != undefined && angular.isString(q) && q.length > 1) {
			$scope.db.readTransaction(function(tx) {
				tx.executeSql('SELECT stop_id as stopId, longitude, latitude, longitude_deg as longitudeDeg, latitude_deg as latitudeDeg, type_id as typeId, inserted, inserted_by_user as insertedByUser, modified, modified_by_user as modifiedByUser, description, tot_preferito as totPreferito, rating, foto_path as fotoPath, homepage, valuta, prezzo_notturno as prezzoNotturno, prezzo_orario as prezzoOrario, prezzo_giornaliero as prezzoGiornaliero, prezzo_settimanale as prezzoSettimanale, prezzo_particolare as prezzoParticolare, acqua, scarico_cassetta as scaricoCassetta, scarico_pozzetto as scaricoPozzetto, prezzo_service as prezzoService, tipo_piazzola as tipoPiazzola, corrente, prezzo_corrente as prezzoCorrente, custodito as accessoCustodito, videosorveglianza, notte, illuminazione, ombra, docce, bagni, bambini, picnic, animali, fermata, wifi, locality, nation, telefono, posti, max_hh as maxHH, chiusura, distance FROM stop_points WHERE (description LIKE ?) OR (locality LIKE ?) ORDER BY description', [q+'%', q+'%'], function (t, stopPoints) {
	   				$scope.stopPoints = [];
	   				for (var i = 0; i < stopPoints.rows.length; i++) {
	   					$scope.stopPoints.push(stopPoints.rows.item(i));
	   	            }
	   			});
			}, function (err) {
   				$ionicPopup.alert({
   					title: $scope.errore,
   					template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
   				});
       		});
		}
	};
	if (isOnline()) {
		syncUserData.sync();
	};
	sharingPosition.bootBackgroundGeoLocation().then(null, null);

    ga_storage._trackPageview('/home', 'App Home - ' + version);
});
angular.module('campersites').controller('loginController', function($scope, $rootScope, $state, $http, $ionicLoading, $ionicPopup, $localStorage, $translate) {
	$translate(['error.errore', 'error.server', 'error.entrako', 'error.connessione', 'error.database']).then(function (translations) {
		$scope.errore = translations['error.errore'];
		$scope.error_server = translations['error.server'];
		$scope.error_entrako = translations['error.entrako'];
		$scope.error_connessione = translations['error.connessione'];
		$scope.error_database = translations['error.database'];
	});
	$scope.goSignup = function() {
		$state.go('signup');
	};
	$scope.user = {
		email: '',
		password: ''
	};
	$scope.db = $rootScope.db;
	$scope.$storage = $localStorage;
	$scope.login = function(form) {
		if (form.$valid) {
			if (isOnline()) {
				$ionicLoading.show({hideOnStateChange: true});
				$http({
				    method: 'POST',
				    url: 'http://www.campersites.info/entraMobile',
				    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				    transformRequest: function(obj) {
				        var str = [];
				        for(var p in obj)
				        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
				        return str.join("&");
				    },
				    data: {Email: $scope.user.email, Password: $scope.user.password}
				}).
				success(function(data, status) {
					if (data.esito === 'OK') {
						$scope.$storage.user = data.user;
						$http({
						    method: 'GET',
						    url: 'http://www.campersites.info/getMobileStopPointsPreferiti?latitude=54.525961&longitude=15.255119&maxDistance=0&userFbId=' + $scope.$storage.user.fbUserId + '&userId=' + $scope.$storage.user.userId
						}).
						success(function(data, status) {
							// Elimino precedenti aree preferite
							$scope.db.transaction(function (t) {
								t.executeSql('DELETE FROM users_preferiti WHERE user_id = ?', [$scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId]);
								// Inserisco le aree preferite
								var today = new Date();
								angular.forEach(data, function(stoppointsbo, i) {
									t.executeSql('INSERT INTO users_preferiti (stop_id, user_id, modified) VALUES (?, ?, ?)',
										[stoppointsbo.stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId, today.getTime()]);
								});
			    				$state.go('index');
							}, 
							function (err) {
								$ionicLoading.hide();
								$ionicPopup.alert({
									title: $scope.errore,
									template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
								});
							});
						}).
						error(function(data, status) {
							$ionicLoading.hide();
							$ionicPopup.alert({
								title: $scope.errore,
								template: $scope.error_server
							});
						});
	            	} else {
	            		$ionicLoading.hide();
	            		$ionicPopup.alert({
	            			title: $scope.errore,
	            			template: $scope.error_entrako
	            		});
	            	}
				}).
				error(function(data, status) {
					$ionicLoading.hide();
	        		$ionicPopup.alert({
	        			title: $scope.errore,
	        			template: $scope.error_server
	        		});
				});
			} else {
				$ionicLoading.hide();
        		$ionicPopup.alert({
        			title: $scope.errore,
        			template: $scope.error_connessione
        		});
			}
		}
	};
	if (device.platform === 'Win32NT') {
	    $document.find('button').attr('data-tap-disabled', true);
	    $document.find('select').attr('data-tap-disabled', true);
	}
    ga_storage._trackPageview('/login', 'App Login - ' + version);
});
angular.module('campersites').controller('signupController', function($scope, $state, $translate, $ionicLoading, $ionicPopup, $http, $ionicHistory) {
	$translate(['error.errore', 'error.server', 'error.registramiko', 'error.nameko', 'label.riuscito', 'label.emailattivazione', 'error.connessione']).then(function (translations) {
		$scope.errore = translations['error.errore'];
		$scope.error_server = translations['error.server'];
		$scope.error_registramiko = translations['error.registramiko'];
		$scope.error_nameko = translations['error.nameko'];
		$scope.label_riuscito = translations['label.riuscito'];
		$scope.label_emailattivazione = translations['label.emailattivazione'];
		$scope.error_connessione = translations['error.connessione'];
	});
	$scope.nameko = false;
	$scope.user = {
		nickname: '',
		email: '',
		password: ''
	};
	$scope.confirmEmail = null;
	$scope.confirmPassword = null;
	$scope.signup = function(form) {
		if (form.$valid) {
			if (isOnline()) {
				$ionicLoading.show({hideOnStateChange: true});
				$scope.nameko = false;
				$http({
				    method: 'POST',
				    url: 'http://www.campersites.info/registramiMobile',
				    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				    transformRequest: function(obj) {
				        var str = [];
				        for(var p in obj)
				        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
				        return str.join("&");
				    },
				    data: {Nickname: $scope.user.nickname, Email: $scope.user.email, Password: $scope.user.password}
				}).
				success(function(data, status) {
					if (data.esito === 'OK') {
						$ionicLoading.hide();
		        		$ionicPopup.alert({
		        			title: $scope.label_riuscito,
		        			template: $scope.label_emailattivazione
		        		});
		        		$ionicHistory.goBack();
	            	} else {
	            		$ionicLoading.hide();
	            		$ionicPopup.alert({
	            			title: $scope.errore,
	            			template: $scope.error_registramiko
	            		});
	            	}
				}).
				error(function(data, status) {
					$ionicLoading.hide();
	        		$ionicPopup.alert({
	        			title: $scope.errore,
	        			template: $scope.error_server
	        		});
				});
			} else {
				$ionicLoading.hide();
        		$ionicPopup.alert({
        			title: $scope.errore,
        			template: $scope.error_connessione
        		});
			}
		}
	};
	if (device.platform === 'Win32NT') {
	    $document.find('button').attr('data-tap-disabled', true);
	    $document.find('select').attr('data-tap-disabled', true);
	}
    ga_storage._trackPageview('/signup', 'App Signup - ' + version);
});
angular.module('campersites').controller('fbLoginController', function($scope, $rootScope, $state, $http, $ionicLoading, $ionicPopup, $localStorage, $translate) {
	$translate(['error.errore', 'error.server', 'error.entrako', 'error.connessione', 'error.database']).then(function (translations) {
		$scope.errore = translations['error.errore'];
		$scope.error_server = translations['error.server'];
		$scope.error_entrako = translations['error.entrako'];
		$scope.error_connessione = translations['error.connessione'];
		$scope.error_database = translations['error.database'];
	});
	$scope.db = $rootScope.db;
	$scope.$storage = $localStorage;
	$scope.fbUser = {
   	    uid: '',
   	    accessToken: '',
   	    nickname: '',
   	    photoPath: '',
   	 	locale: ''
	};
	$scope.fbLogin = function() {
		if (isOnline()) {
			$ionicLoading.show({hideOnStateChange: true});
			openFB.login(
				function(response) {
					if (response.status === 'connected') {
			    	 	openFB.api({
			    	        path: '/me',
			    	        params: {fields: 'id,name,locale,picture.width(75).height(75)'},
			    	        success: function(user) {
					    	    $scope.fbUser.uid = user.id;
					    	    $scope.fbUser.nickname = user.name;
					    	    $scope.fbUser.photoPath = user.picture.data.url;
					    	 	$scope.fbUser.locale = user.locale;
		    	    			$scope.fbUser.accessToken = response.authResponse.accessToken;
								$http({
								    method: 'POST',
								    url: 'http://www.campersites.info:8082/user/fbLogin',
								    data: $scope.fbUser
								}).
								then(function(response) {
									$scope.$storage.user = response.data;
									$http({
									    method: 'GET',
									    url: 'http://www.campersites.info/getMobileStopPointsPreferiti?latitude=54.525961&longitude=15.255119&maxDistance=0&userFbId=' + $scope.$storage.user.fbUserId + '&userId=' + $scope.$storage.user.userId
									}).
									success(function(data, status) {
										// Elimino precedenti aree preferite
										$scope.db.transaction(function (t) {
											t.executeSql('DELETE FROM users_preferiti WHERE user_id = ?', [$scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId]);
											// Inserisco le aree preferite
											var today = new Date();
											angular.forEach(data, function(stoppointsbo, i) {
												t.executeSql('INSERT INTO users_preferiti (stop_id, user_id, modified) VALUES (?, ?, ?)',
													[stoppointsbo.stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId, today.getTime()]);
											});
						    				$state.go('index');
										}, 
										function (err) {
											$ionicLoading.hide();
											$ionicPopup.alert({
												title: $scope.errore,
												template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
											});
										});
									}).
									error(function(data, status) {
										$ionicLoading.hide();
										$ionicPopup.alert({
											title: $scope.errore,
											template: $scope.error_server
										});
									});
								}, function(response) {
									$ionicLoading.hide();
					        		$ionicPopup.alert({
					        			title: $scope.errore,
					        			template: $scope.error_server
					        		});
								});
			    	        },
			    	        error: function(error) {
								$ionicLoading.hide();
				        		$ionicPopup.alert({
				        			title: $scope.errore,
				        			template: $scope.error_server
				        		});
			    	        }
			    	    });
					} else {
						$ionicLoading.hide();
		        		$ionicPopup.alert({
		        			title: $scope.errore,
		        			template: $scope.error_server
		        		});
					}
				},
				{scope: 'email,publish_actions'});
		} else {
			$ionicLoading.hide();
    		$ionicPopup.alert({
    			title: $scope.errore,
    			template: $scope.error_connessione
    		});
		}
	};
});
angular.module('campersites').controller('settingsController', function($scope, $localStorage, $translate, sharingPosition) {
	$translate(['label.altro', 'label.online', 'label.offline', 'label.si', 'label.no']).then(function (translations) {
		$scope.label_altro = translations['label.altro'];
		$scope.label_online = translations['label.online'];
		$scope.label_offline = translations['label.offline'];
		$scope.label_si = translations['label.si'];
		$scope.label_no = translations['label.no'];
	});
	$scope.$storage = $localStorage;
	$scope.isWinPhone = false;
	if (device.platform === 'Win32NT') {
		$scope.isWinPhone = true;
		$scope.navOptions = [{name:$scope.label_altro, shade:'Altro'},{name:'Google Maps', shade:'GoogleMaps'},{name:'Sygic', shade:'Sygic'},{name:'Navigon', shade:'Navigon'},{name:'TomTom', shade:'TomTom'}];
		$scope.mapsOptions = [{name:$scope.label_online, shade:1},{name:$scope.label_offline, shade:0}];
		$scope.positionsOptions = [{name:$scope.label_si, shade:1},{name:$scope.label_no, shade:0}];
	}
	$scope.toggleSharePosition = function() {
		if ($scope.$storage.sharePosition == 1) {
			sharingPosition.startBackgroundGeoLocation();
		} else {
			sharingPosition.stopBackgroundGeoLocation();
		}
	}
    ga_storage._trackPageview('/settings', 'App Settings - ' + version);
});
angular.module('campersites').controller('downloadsController', function($scope, $rootScope, $http, $ionicLoading, $ionicPopup, $localStorage, $stateParams, $translate, $window) {
	$translate(['error.errore', 'label.conferma', 'label.confermaelimina', 'error.server', 'error.database', 'label.downloading', 'error.connessione', 'error.filesystem', 'label.processing', 'label.remainingtime']).then(function (translations) {
		$scope.errore = translations['error.errore'];
		$scope.conferma = translations['label.conferma'];
		$scope.conferma_elimina = translations['label.confermaelimina'];
		$scope.error_server = translations['error.server'];
		$scope.error_database = translations['error.database'];
		$scope.label_downloading = translations['label.downloading'];
		$scope.label_processing = translations['label.processing'];
		$scope.label_remainingtime = translations['label.remainingtime'];
		$scope.error_connessione = translations['error.connessione'];
		$scope.error_filesystem = translations['error.filesystem'];
	});
	$scope.$storage = $localStorage;
	$scope.nations = $stateParams.nations;
	$scope.nationsMap = $stateParams.nationsMap;
	$scope.db = $rootScope.db;
	$scope.dbTiles = $rootScope.dbTiles;

	$scope.downloadStopPoint = function(nation) {
		if (isOnline()) {
			$ionicLoading.show({hideOnStateChange: true, template: '<p><ion-spinner></ion-spinner></p><p>'+$scope.label_downloading+'</p>'});
			$http({
			    method: 'GET',
			    url: 'http://www.campersites.info/getMobileStopPointsByNation?nation=' + nation.nation
			}).
			success(function(data, status) {
				// Elimino precedenti aree
				$scope.db.transaction(function (t) {
					t.executeSql('DELETE FROM stop_points WHERE nation = ?', [nation.nation]);
					// Inserisco le nuove aree
					angular.forEach(data, function(stoppointsbo, i) {
						t.executeSql('INSERT OR REPLACE INTO stop_points (stop_id, latitude, longitude, latitude_deg, longitude_deg, type_id, inserted, inserted_by_user, modified, modified_by_user, description, tot_preferito, rating, foto_path, homepage, valuta, prezzo_notturno, prezzo_orario, prezzo_giornaliero, prezzo_settimanale, prezzo_particolare, acqua, scarico_cassetta, scarico_pozzetto, prezzo_service, tipo_piazzola, corrente, prezzo_corrente, custodito, videosorveglianza, notte, illuminazione, ombra, docce, bagni, bambini, picnic, animali, fermata, wifi, locality, nation, telefono, posti, max_hh, chiusura) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
							[stoppointsbo.stopId, stoppointsbo.latitude, stoppointsbo.longitude, stoppointsbo.latitudeDeg, stoppointsbo.longitudeDeg, stoppointsbo.typeId, stoppointsbo.inserted, stoppointsbo.insertedByUser, stoppointsbo.modified, stoppointsbo.modifiedByUser, stoppointsbo.description, stoppointsbo.totPreferito, stoppointsbo.rating, stoppointsbo.fotoPath, stoppointsbo.homepage, stoppointsbo.valuta, stoppointsbo.prezzoNotturno, stoppointsbo.prezzoOrario, stoppointsbo.prezzoGiornaliero, stoppointsbo.prezzoSettimanale, stoppointsbo.prezzoParticolare, stoppointsbo.acqua, stoppointsbo.scaricoCassetta, stoppointsbo.scaricoPozzetto, stoppointsbo.prezzoService, stoppointsbo.tipoPiazzola, stoppointsbo.corrente, stoppointsbo.prezzoCorrente, stoppointsbo.accessoCustodito, stoppointsbo.videosorveglianza, stoppointsbo.notte, stoppointsbo.illuminazione, stoppointsbo.ombra, stoppointsbo.docce, stoppointsbo.bagni, stoppointsbo.bambini, stoppointsbo.picnic, stoppointsbo.animali, stoppointsbo.fermata, stoppointsbo.wifi, stoppointsbo.locality, stoppointsbo.nation, stoppointsbo.telefono, stoppointsbo.posti, stoppointsbo.maxHH, stoppointsbo.chiusura]);
						// Inserisco le relative recensioni
						angular.forEach(stoppointsbo.reviews, function(review, j) {
							t.executeSql('INSERT OR REPLACE INTO users_reviews (stop_id, user_id, rating, review, modified) VALUES (?, ?, ?, ?, ?)', [review.stopId, review.userId, review.rating, review.review, review.inserted]);
						});
					});
					var today = new Date();
					nation.lastAreeDownload = dateFormat(today.getTime());
					nation.totAree = data.length;
					var found = false;
					angular.forEach($scope.$storage.nations, function(localNation, i) {
						if (localNation.nation === nation.nation) {
							localNation.lastAreeDownload = dateFormat(today.getTime());
							localNation.totAree = data.length;
							found = true;
						}
					});
					if (!found) {
						$scope.$storage.nations.push(nation);
					}
					t.executeSql('INSERT OR REPLACE INTO downloads (nation, data_aggiornamento) VALUES (?, ?)', [nation.nation, today.getTime()]);
					$scope.$storage.nations = $scope.nations;
					$ionicLoading.hide();
				}, 
				function (err) {
					$ionicLoading.hide();
					$ionicPopup.alert({
						title: $scope.errore,
						template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
					});
				});
			}).
			error(function(data, status) {
				$ionicLoading.hide();
				$ionicPopup.alert({
					title: $scope.errore,
					template: $scope.error_server
				});
			});
		} else {
			$ionicPopup.alert({
				title: $scope.errore,
				template: $scope.error_connessione
			});
		}
	};
	$scope.progressTotal = 0;
	$scope.progressLoaded = 0;
	$scope.loaded = 0;
	$scope.downloadMap = function(nation) {
		//alert("nation: "+nation);
		if (isOnline()) {
			window.plugins.insomnia.keepAwake();
			$ionicLoading.show({hideOnStateChange: true, template: '<p><ion-spinner></ion-spinner></p><p>'+$scope.label_downloading+'</p>'});
			var fileTransfer = new FileTransfer();
			var startTime = (new Date()).getTime();
			var endTime = null;
			if (device.platform != 'Win32NT') {
				fileTransfer.onprogress = function (progressEvent) {
					if (progressEvent.lengthComputable) {
						$ionicLoading.show({hideOnStateChange: true, template: '<p><progress max="'+$scope.progressTotal+'" value="'+$scope.progressLoaded+'"></progress></p><p>'+$scope.label_downloading+' '+$scope.loaded+'%</p><p>'+$scope.label_remainingtime+' '+ endTime + '</p>'});
						$scope.progressTotal = progressEvent.total;
						$scope.progressLoaded = progressEvent.loaded;
						$scope.loaded = Math.ceil(progressEvent.loaded / progressEvent.total * 100);
						endTime = msToTime((((new Date()).getTime() - startTime)/progressEvent.loaded)*(progressEvent.total-progressEvent.loaded));
					}
				};
			}
			//$ionicPopup.alert({
			//	title: "DUBUG",
			//	template: "theFileDBDownload.toURL(): "+cordova.file.dataDirectory+nation.nation+"CamperSitesDbMaps.sqlite"
			//});
			//alert("theFileDBDownload.toURL(): "+cordova.file.dataDirectory+nation.nation+"CamperSitesDbMaps.sqlite");
			//console.log("theFileDBDownload.toURL(): "+cordova.file.dataDirectory+nation.nation+"CamperSitesDbMaps.sqlite");
			//alert("download: "+'http://www.campersites.info:8000/dbMaps/'+nation.nation+'CamperSitesDbMaps.sqlite');
			fileTransfer.download('http://www.campersites.info:8000/dbMaps/'+nation.nation+'CamperSitesDbMaps.sqlite', cordova.file.dataDirectory+nation.nation+'CamperSitesDbMaps.sqlite', function(theFile) {
				//alert("theFile.toURL(): "+theFile.toURL());
				if (device.platform === 'iOS' && theFile.setMetadata) {
					theFile.setMetadata(null, null, {"com.apple.MobileBackup": 1});
				}
				// Copy data from downloaded file to dbMap
				//$scope.progressTotal = 0;
				//$scope.progressLoaded = 0;
				//$scope.loaded = 0;
				//$ionicLoading.show({hideOnStateChange: true, template: '<p><ion-spinner></ion-spinner></p><p>'+$scope.label_processing+'</p>'});
				var nameDb = nation.nation+'CamperSitesDbMaps.sqlite';
				if (device.platform === 'iOS') {
					nameDb = "NoCloud/" + nameDb;
				}
				var dbFile = $window.sqlitePlugin.openDatabase({name: nameDb, iosDatabaseLocation: 'Library', androidDatabaseImplementation: 2});
				dbFile.readTransaction(function(txFirst) {
					txFirst.executeSql('SELECT ZOOM_LEVEL, MIN(TILE_COLUMN) AS min_tile_column, MAX(TILE_COLUMN) AS max_tile_column, MIN(TILE_ROW) AS min_tile_row, MAX(TILE_ROW) AS max_tile_row FROM tiles GROUP BY ZOOM_LEVEL', [], function (txFirst, rowTiles) {
						//alert("count tiles: "+JSON.stringify(countTiles));
						$scope.dbTiles.transaction(function(t) {
							//alert("aperta transazione dbTiles: "+t);
							for (var i = 0; i < rowTiles.rows.length; i++) {
								var infotile = rowTiles.rows.item(i);
								t.executeSql("INSERT OR REPLACE INTO infotiles (zoom_level, min_tile_column, max_tile_column, min_tile_row, max_tile_row, tile_nation) VALUES (?, ?, ?, ?, ?, ?)", [infotile.zoom_level, infotile.min_tile_column, infotile.max_tile_column, infotile.min_tile_row, infotile.max_tile_row, nation.nation], null,
								function (err) {
									$ionicLoading.hide();
									$ionicPopup.alert({
										title: $scope.errore,
										template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
									});
									window.plugins.insomnia.allowSleepAgain();
								});
				            }
						}, function (err) {
							$ionicLoading.hide();
							$ionicPopup.alert({
								title: $scope.errore,
								template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
							});
							window.plugins.insomnia.allowSleepAgain();
						}, function () {
							var today = new Date();
							nation.lastMappeDownload = dateFormat(today.getTime());
							var found = false;
							angular.forEach($scope.$storage.nationsMap, function(localNation, j) {
								if (localNation.nation === nation.nation) {
									localNation.lastMappeDownload = dateFormat(today.getTime());
									found = true;
								}
							});
							if (!found) {
								$scope.$storage.nationsMap.push(nation);
							}
							$scope.$storage.nationsMap = $scope.nationsMap;
							$ionicLoading.hide();
							window.plugins.insomnia.allowSleepAgain();
						});
					}, function (err) {
						$ionicLoading.hide();
						$ionicPopup.alert({
							title: $scope.errore,
							template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
						});
						window.plugins.insomnia.allowSleepAgain();
					});
				}, function (err) {
					$ionicLoading.hide();
					$ionicPopup.alert({
						title: $scope.errore,
						template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
					});
					window.plugins.insomnia.allowSleepAgain();
				});
			},
			function(err) {
				//alert("err download: " + JSON.stringify(err));
				$ionicLoading.hide();
				$ionicPopup.alert({
					title: $scope.errore,
					template: $scope.error_server + " (" + err.code + ", " + err.message + ") "
				});
				window.plugins.insomnia.allowSleepAgain();
			}); 
		} else {
			$ionicPopup.alert({
				title: $scope.errore,
				template: $scope.error_connessione
			});
		}
	};
	$scope.deleteMap = function(nation) {
		var confirmPopup = $ionicPopup.confirm({
			title: $scope.conferma,
			template: $scope.conferma_elimina
		});
		confirmPopup.then(function(res) {
			if (res) {
				$ionicLoading.show({hideOnStateChange: true});
				$scope.dbTiles.transaction(function(txDel) {
					txDel.executeSql("DELETE FROM infotiles WHERE tile_nation = '"+nation.nation+"'");
					txDel.executeSql("DELETE FROM tiles WHERE tile_nations = '"+nation.nation+";'", [], function (txDel, deleted) {
						$scope.dbTiles.transaction(function(txUpd) {
							txUpd.executeSql("UPDATE tiles SET tile_nations = REPLACE(tile_nations, '"+nation.nation+";', '') WHERE (tile_nations LIKE ?)", ['%'+nation.nation+'%'], function (txUpd, updated) {
								nation.lastMappeDownload = null;
								angular.forEach($scope.$storage.nationsMap, function(localNation, j) {
									if (localNation.nation === nation.nation) {
										localNation.lastMappeDownload = null;
									}
								});
								$scope.$storage.nationsMap = $scope.nationsMap;
								$ionicLoading.hide();
							});
						},
						function (err) {
							$ionicLoading.hide();
							$ionicPopup.alert({
								title: $scope.errore,
								template: $scope.error_database + " update tile (" + err.code + ", " + err.message + ") "
							});
						});
					},
					function (err) {
						$ionicLoading.hide();
						$ionicPopup.alert({
							title: $scope.errore,
							template: $scope.error_database + " delete tile (" + err.code + ", " + err.message + ") "
						});
					});
				},
				function (err) {
					$ionicLoading.hide();
					$ionicPopup.alert({
						title: $scope.errore,
						template: $scope.error_database + " txDel (" + err.code + ", " + err.message + ") "
					});
				});
				// Elimino file db
				//alert("theFileDBDownload.toURL(): "+cordova.file.dataDirectory+nation.nation+'CamperSitesDbMaps.sqlite');
				$window.resolveLocalFileSystemURL(cordova.file.dataDirectory+nation.nation+'CamperSitesDbMaps.sqlite', function(theFile) {
					//alert("theFile: " + theFile);
					theFile.remove(function() {
						null;
					}, function (err) {
						$ionicLoading.hide();
						$ionicPopup.alert({
							title: $scope.errore,
							template: $scope.error_filesystem + " (" + err.code + ", " + err.message + ") "
						});
					});
				});
			}
		});
	};
    ga_storage._trackPageview('/downloads', 'App Downloads - ' + version);
});
angular.module('campersites').controller('userController', function($scope, $rootScope, $state, $localStorage, $translate, $ionicLoading, $ionicPopup, rilevaPosizione) {
	$translate(['error.errore', 'error.database']).then(function (translations) {
		$scope.errore = translations['error.errore'];
		$scope.error_database = translations['error.database'];
	});
	$scope.$storage = $localStorage;
	$scope.db = $rootScope.db;
	$scope.stopPoints = [];
	$scope.logout = function() {
		delete $scope.$storage.user;
		$state.go('index');
	};
	$scope.goFavorites = function() {
		$ionicLoading.show({hideOnStateChange: true});
		$scope.db.readTransaction(function (t) {
			t.executeSql('SELECT sp.stop_id as stopId, longitude, latitude, longitude_deg as longitudeDeg, latitude_deg as latitudeDeg, type_id as typeId, inserted, inserted_by_user as insertedByUser, sp.modified, modified_by_user as modifiedByUser, description, tot_preferito as totPreferito, rating, foto_path as fotoPath, homepage, valuta, prezzo_notturno as prezzoNotturno, prezzo_orario as prezzoOrario, prezzo_giornaliero as prezzoGiornaliero, prezzo_settimanale as prezzoSettimanale, prezzo_particolare as prezzoParticolare, acqua, scarico_cassetta as scaricoCassetta, scarico_pozzetto as scaricoPozzetto, prezzo_service as prezzoService, tipo_piazzola as tipoPiazzola, corrente, prezzo_corrente as prezzoCorrente, custodito as accessoCustodito, videosorveglianza, notte, illuminazione, ombra, docce, bagni, bambini, picnic, animali, fermata, wifi, locality, nation, telefono, posti, max_hh as maxHH, chiusura, distance FROM stop_points sp, users_preferiti up WHERE sp.stop_id = up.stop_id AND up.user_id = ?', [$scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId], function (t, stopPoints) {
				if (stopPoints.rows.length > 0) {
	            	for (var i = 0; i < stopPoints.rows.length; i++) {
	            		$scope.stopPoints.push(stopPoints.rows.item(i));
	            	}
					rilevaPosizione.exec().then(function(position) {
	        			angular.forEach($scope.stopPoints, function(stoppointsbo, i) {
	        				var distance = getDistanceFromLatLonInKm(position.coords.latitude, position.coords.longitude, stoppointsbo.latitude, stoppointsbo.longitude).toFixed(2);
	        				stoppointsbo.distance = distance;
	        			});
	        			$scope.stopPoints.sort(function(a, b) {return a.distance - b.distance;});
	        			$state.go('favorites', {stopPoints: $scope.stopPoints});
	        		}, function (err) {
	        			$state.go('favorites', {stopPoints: $scope.stopPoints});
					});
	            }
			});
		},
		function (err) {
			$ionicLoading.hide();
			$ionicPopup.alert({
				title: $scope.errore,
				template: $scope.error_database
			});
		});
	};
	
	$scope.addStopPoint = function() {
		var stopPoint = {
				stopId: null,
				latitude: '',
				longitude: '',
				description: '',
				locality: '',
				nation: 'it',
				homepage: '',
				telefono: '',
				chiusura: '',
				typeId: 'PS',
				prezzoNotturno: '',
				prezzoOrario: '',
				prezzoGiornaliero: '',
				prezzoSettimanale: '',
				prezzoParticolare: '',
				acqua: '',
				scaricoCassetta: '',
				scaricoPozzetto: '',
				prezzoService: '',
				corrente: '',
				prezzoCorrente: '',
				tipoPiazzola: 'ST',
				accessoCustodito: '',
				videosorveglianza: '',
				notte: '',
				illuminazione: '',
				ombra: '',
				posti: '',
				maxHH: '',
				docce: '',
				bagni: '',
				bambini: '',
				picnic: '',
				animali: '',
				fermata: '',
				wifi: '',
				valuta: 'EUR'
		};
		$state.go('modifyArea', {stopPoint: stopPoint, preferito: false, howRated: null});
	};
    ga_storage._trackPageview('/user', 'App User - ' + version);
});
angular.module('campersites').controller('favoritesController', function($scope, $rootScope, $state, $stateParams, $translate, $ionicLoading, $ionicPopup, $localStorage) {
	$translate(['error.errore', 'error.server', 'label.gratuito', 'error.database', 'label.no', 'label.si']).then(function (translations) {
		$scope.errore = translations['error.errore'];
		$scope.error_server = translations['error.server'];
		$scope.label_gratuito = translations['label.gratuito'];
		$scope.error_database = translations['error.database'];
		$scope.label_no = translations['label.no'];
		$scope.label_si = translations['label.si'];
	});
	$scope.$storage = $localStorage;
	$scope.stopPoints = $stateParams.stopPoints;
	$scope.db = $rootScope.db;

	$scope.getNotte = function(stopPoint){
		if (stopPoint.notte == 0) return $scope.label_no;
		if (stopPoint.notte == 1) return $scope.label_si;
		return '-';
	};
	$scope.getNotteClass = function(stopPoint){
		if (stopPoint.notte == 0) return 'assertive';
		if (stopPoint.notte == 1) return 'balanced';
		return '';
	};
	$scope.getPrezzo = function(stopPoint){
		if (parseFloat(stopPoint.prezzoGiornaliero)) return stopPoint.prezzoGiornaliero;
		if (parseFloat(stopPoint.prezzoOrario)) return stopPoint.prezzoOrario;
		if (parseFloat(stopPoint.prezzoNotturno)) return stopPoint.prezzoNotturno;
		if (parseFloat(stopPoint.prezzoSettimanale)) return stopPoint.prezzoSettimanale;
		if (stopPoint.prezzoParticolare != '') return stopPoint.prezzoParticolare;
		if (parseFloat(stopPoint.prezzoNotturno) == 0 ||
			parseFloat(stopPoint.prezzoOrario) == 0 ||
			parseFloat(stopPoint.prezzoGiornaliero) == 0 ||
			parseFloat(stopPoint.prezzoSettimanale) == 0 ||
			stopPoint.prezzoParticolare === '') return $scope.label_gratuito;
		return '-';
	};
	$scope.getPrezzoClass = function(stopPoint){
		if (parseFloat(stopPoint.prezzoGiornaliero)) return 'assertive';
		if (parseFloat(stopPoint.prezzoOrario)) return 'assertive';
		if (parseFloat(stopPoint.prezzoNotturno)) return 'assertive';
		if (parseFloat(stopPoint.prezzoSettimanale)) return 'assertive';
		if (stopPoint.prezzoParticolare != '') return 'assertive';
		if (parseFloat(stopPoint.prezzoNotturno) == 0 ||
			parseFloat(stopPoint.prezzoOrario) == 0 ||
			parseFloat(stopPoint.prezzoGiornaliero) == 0 ||
			parseFloat(stopPoint.prezzoSettimanale) == 0 ||
			stopPoint.prezzoParticolare === '') return 'balanced';
		return '';
	};
	$scope.getChiusura = function(stopPoint){
		if (stopPoint.chiusura != '') return stopPoint.chiusura;
		return '-';
	};
	$scope.getRating = function(stopPoint){
		if (stopPoint.rating > 0) return Math.round((stopPoint.rating * 100) / 5);
		return '-';
	};
	$scope.goDetail = function(stopId){
		//alert("stopId: "+stopId);
		$ionicLoading.show({hideOnStateChange: true});
		$scope.db.readTransaction(function(tx) {
			tx.executeSql('SELECT stop_id as stopId, longitude, latitude, longitude_deg as longitudeDeg, latitude_deg as latitudeDeg, type_id as typeId, inserted, inserted_by_user as insertedByUser, modified, modified_by_user as modifiedByUser, description, tot_preferito as totPreferito, rating, foto_path as fotoPath, homepage, valuta, prezzo_notturno as prezzoNotturno, prezzo_orario as prezzoOrario, prezzo_giornaliero as prezzoGiornaliero, prezzo_settimanale as prezzoSettimanale, prezzo_particolare as prezzoParticolare, acqua, scarico_cassetta as scaricoCassetta, scarico_pozzetto as scaricoPozzetto, prezzo_service as prezzoService, tipo_piazzola as tipoPiazzola, corrente, prezzo_corrente as prezzoCorrente, custodito as accessoCustodito, videosorveglianza, notte, illuminazione, ombra, docce, bagni, bambini, picnic, animali, fermata, wifi, locality, nation, telefono, posti, max_hh as maxHH, chiusura, distance FROM stop_points WHERE stop_id = ?', [stopId], function (t, res) {
				//alert("res.rows.length: "+res.rows.length);
				var stopPoint = res.rows.item(0);
				var preferito = false;
    			var howRated = null;
				if (res.rows.length > 0) {
    				tx.executeSql("SELECT stop_id as stopId, user_id as userId, rating, review, modified FROM users_reviews WHERE stopId = ? AND review IS NOT NULL AND review != '' ORDER BY modified DESC ", [stopId], function (tx, reviews) {
    					if (reviews.rows.length > 0) {
    						stopPoint.reviews = [];
	    					for (var i = 0; i < reviews.rows.length; i++) {
	    						stopPoint.reviews.push(reviews.rows.item(i));
							}
	    	            }
    					if ($scope.$storage.user != null) {
    						tx.executeSql('SELECT * FROM users_preferiti WHERE stop_id = ? and user_id = ?', [stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId], function (tx, preferiti) {
	        					if (preferiti.rows.length > 0) {
			    					preferito = true;
			    	            }
		        				tx.executeSql('SELECT * FROM users_reviews WHERE stop_id = ? and user_id = ?', [stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId], function (tx, ratings) {
		        					if (ratings.rows.length > 0) {
				    					howRated = ratings.rows.item(0).rating;
				    	            }
		    						$state.go('detail', {stopPoint: stopPoint, preferito: preferito, howRated: howRated});
				    			});
			    			});
    					} else {
        					$state.go('detail', {stopPoint: stopPoint, preferito: preferito, howRated: howRated});
    					}
	    			});
				} else {
					$ionicLoading.hide();
					$ionicPopup.alert({
						title: $scope.errore,
						template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
					});
				}
   			});
		}, function (err) {
			$ionicLoading.hide();
			$ionicPopup.alert({
				title: $scope.errore,
				template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
			});
   		});
	};
    ga_storage._trackPageview('/favorites', 'App Favorites - ' + version);
});
angular.module('campersites').controller('searchedController', function($scope, $state, $localStorage, $ionicLoading, $ionicPopup, $translate, $rootScope, $stateParams) {
	$translate(['error.errore', 'error.server', 'label.gratuito', 'error.database', 'label.no', 'label.si']).then(function (translations) {
		$scope.errore = translations['error.errore'];
		$scope.error_server = translations['error.server'];
		$scope.label_gratuito = translations['label.gratuito'];
		$scope.error_database = translations['error.database'];
		$scope.label_no = translations['label.no'];
		$scope.label_si = translations['label.si'];
	});
	$scope.$storage = $localStorage;
	$scope.stopPoints = $stateParams.stopPoints;
	$scope.db = $rootScope.db;
	$scope.dbTiles = $rootScope.dbTiles;

	$scope.getNotte = function(stopPoint){
		if (stopPoint.notte == 0) return $scope.label_no;
		if (stopPoint.notte == 1) return $scope.label_si;
		return '-';
	};
	$scope.getNotteClass = function(stopPoint){
		if (stopPoint.notte == 0) return 'assertive';
		if (stopPoint.notte == 1) return 'balanced';
		return '';
	};
	$scope.getPrezzo = function(stopPoint){
		if (parseFloat(stopPoint.prezzoGiornaliero)) return stopPoint.prezzoGiornaliero;
		if (parseFloat(stopPoint.prezzoOrario)) return stopPoint.prezzoOrario;
		if (parseFloat(stopPoint.prezzoNotturno)) return stopPoint.prezzoNotturno;
		if (parseFloat(stopPoint.prezzoSettimanale)) return stopPoint.prezzoSettimanale;
		if (stopPoint.prezzoParticolare != '') return stopPoint.prezzoParticolare;
		if (parseFloat(stopPoint.prezzoNotturno) == 0 ||
			parseFloat(stopPoint.prezzoOrario) == 0 ||
			parseFloat(stopPoint.prezzoGiornaliero) == 0 ||
			parseFloat(stopPoint.prezzoSettimanale) == 0 ||
			stopPoint.prezzoParticolare === '') return $scope.label_gratuito;
		return '-';
	};
	$scope.getPrezzoClass = function(stopPoint){
		if (parseFloat(stopPoint.prezzoGiornaliero)) return 'assertive';
		if (parseFloat(stopPoint.prezzoOrario)) return 'assertive';
		if (parseFloat(stopPoint.prezzoNotturno)) return 'assertive';
		if (parseFloat(stopPoint.prezzoSettimanale)) return 'assertive';
		if (stopPoint.prezzoParticolare != '') return 'assertive';
		if (parseFloat(stopPoint.prezzoNotturno) == 0 ||
			parseFloat(stopPoint.prezzoOrario) == 0 ||
			parseFloat(stopPoint.prezzoGiornaliero) == 0 ||
			parseFloat(stopPoint.prezzoSettimanale) == 0 ||
			stopPoint.prezzoParticolare === '') return 'balanced';
		return '';
	};
	$scope.getChiusura = function(stopPoint){
		if (stopPoint.chiusura != '') return stopPoint.chiusura;
		return '-';
	};
	$scope.getRating = function(stopPoint){
		if (stopPoint.rating > 0) return Math.round((stopPoint.rating * 100) / 5);
		return '-';
	};
	$scope.goDetail = function(stopId){
		//alert("stopId: "+stopId);
		$ionicLoading.show({hideOnStateChange: true});
		$scope.db.readTransaction(function(tx) {
			tx.executeSql('SELECT stop_id as stopId, longitude, latitude, longitude_deg as longitudeDeg, latitude_deg as latitudeDeg, type_id as typeId, inserted, inserted_by_user as insertedByUser, modified, modified_by_user as modifiedByUser, description, tot_preferito as totPreferito, rating, foto_path as fotoPath, homepage, valuta, prezzo_notturno as prezzoNotturno, prezzo_orario as prezzoOrario, prezzo_giornaliero as prezzoGiornaliero, prezzo_settimanale as prezzoSettimanale, prezzo_particolare as prezzoParticolare, acqua, scarico_cassetta as scaricoCassetta, scarico_pozzetto as scaricoPozzetto, prezzo_service as prezzoService, tipo_piazzola as tipoPiazzola, corrente, prezzo_corrente as prezzoCorrente, custodito as accessoCustodito, videosorveglianza, notte, illuminazione, ombra, docce, bagni, bambini, picnic, animali, fermata, wifi, locality, nation, telefono, posti, max_hh as maxHH, chiusura, distance FROM stop_points WHERE stop_id = ?', [stopId], function (t, res) {
				//alert("res.rows.length: "+res.rows.length);
				var stopPoint = res.rows.item(0);
				var preferito = false;
    			var howRated = null;
				if (res.rows.length > 0) {
    				tx.executeSql("SELECT stop_id as stopId, user_id as userId, rating, review, modified FROM users_reviews WHERE stopId = ? AND review IS NOT NULL AND review != '' ORDER BY modified DESC ", [stopId], function (tx, reviews) {
    					if (reviews.rows.length > 0) {
    						stopPoint.reviews = [];
	    					for (var i = 0; i < reviews.rows.length; i++) {
	    						stopPoint.reviews.push(reviews.rows.item(i));
							}
	    	            }
    					if ($scope.$storage.user != null) {
    						tx.executeSql('SELECT * FROM users_preferiti WHERE stop_id = ? and user_id = ?', [stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId], function (tx, preferiti) {
	        					if (preferiti.rows.length > 0) {
			    					preferito = true;
			    	            }
		        				tx.executeSql('SELECT * FROM users_reviews WHERE stop_id = ? and user_id = ?', [stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId], function (tx, ratings) {
		        					if (ratings.rows.length > 0) {
				    					howRated = ratings.rows.item(0).rating;
				    	            }
		    						$state.go('detail', {stopPoint: stopPoint, preferito: preferito, howRated: howRated});
				    			});
			    			});
    					} else {
        					$state.go('detail', {stopPoint: stopPoint, preferito: preferito, howRated: howRated});
    					}
	    			});
				} else {
					$ionicLoading.hide();
					$ionicPopup.alert({
						title: $scope.errore,
						template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
					});
				}
   			});
		}, function (err) {
			$ionicLoading.hide();
			$ionicPopup.alert({
				title: $scope.errore,
				template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
			});
   		});
	};

	if ($scope.$storage.apprate[version].countOpens >= 5 && $scope.$storage.apprate[version].enabled == 1) {
        navigator.notification.confirm($rootScope.label_apprate_text,
        function(button) {
            // yes = 1, no = 2, later = 3
            if (button == '1') {    // Rate Now
                if (device.platform === 'iOS') {
                    window.open('itms-apps://itunes.apple.com/en/app/id824226229');
                } else if (device.platform === 'Android') {
                    window.open('market://details?id=info.camperstop');
                } else if (device.platform === 'Win32NT'){
                    window.open('ms-windows-store:Review?name=60111GianlucaAiello.CamperSites');
                }
                $scope.$storage.apprate[version].enabled = 0;
            } else if (button == '2') { // Later
            	$scope.$storage.apprate[version].countOpens = 1;
            } else if (button == '3') { // No
            	$scope.$storage.apprate[version].enabled = 0;
            }
        }, 'CamperSites', [$rootScope.label_apprate_agree, $rootScope.label_apprate_remind, $rootScope.label_apprate_decline]);
    } else if ($scope.$storage.apprate[version].enabled == 1) {
    	$scope.$storage.apprate[version].countOpens++;
    }

	ga_storage._trackPageview('/searched', 'App Searched - ' + version);
});
angular.module('campersites').controller('searchedMapController', function($rootScope, $scope, $translate, $state, $ionicLoading, $ionicPopup, $http, $localStorage, loadGoogleMapAPI, leafletData) {
	$translate(['error.errore', 'error.database', 'error.server', 'label.logout']).then(function (translations) {
		$scope.errore = translations['error.errore'];
		$scope.error_database = translations['error.database'];
		$scope.error_server = translations['error.server'];
		$scope.label_logout = translations['label.logout'];
	});
	$scope.$storage = $localStorage;
	$scope.db = $rootScope.db;
	$scope.usersPositions = ($scope.$storage.sharePosition == 1) ? true : false;
	$scope.usersPositions = (isOnline()) ? true : false;
	$scope.defaultsMap = {
	    disableDoubleClickZoom: true,
		dragging: true,
		touchZoom: true,
		scrollWheelZoom: false,
		doubleClickZoom: false,
		zoomControl: false,
		bounceAtZoomLimits: false
	};
	$scope.centerMap = {
	    lat: parseFloat($scope.stopPoints[0].latitude),
	    lng: parseFloat($scope.stopPoints[0].longitude),
	    zoom: 12
	};
	$scope.controlsMap = {
	    scale: true
	};
	$scope.layersMap = {
	    baselayers: {},
	    overlays: {
        	stopPoint: {
            	type: 'group',
                name: 'stopPoint',
            	visible: true
            },
        	usersPositions: {
        		type: 'group',
        		name: 'usersPositions',
        		visible: true
         	}
        }
	};
	$scope.maxboundsMap = {
	   	northEast: {
	        lat: 71.718882,
	        lng: 46.318359
	    },
	    southWest: {
	        lat: 33.358062,
	        lng: -15.117188
	    }
	};
	$scope.markersMap = new Array();

	$scope.isOnline = function() {
		return isOnline();
	};
	$scope.toggleUsersPositions = function(){
		$scope.usersPositions = $scope.usersPositions ? false : true;
		if ($scope.usersPositions) {
			var range = parseFloat(parseFloat($scope.$storage.distanza)/100);
			var lat = parseFloat($scope.stopPoints[0].latitude);
	    	var lng = parseFloat($scope.stopPoints[0].longitude);
			var boundToUrlValue = coordsToUrlValue(lat-range, lng-range, lat+range, lng+range);
			$http({
			    method: 'GET',
			    url: 'http://www.campersites.info:8082/positions/bound/'+boundToUrlValue,
			    headers: {'Content-Type': 'application/json'}
			}).
			then(function(response) {
				angular.forEach(response.data, function(position, i) {
					var contentString = "<span><div class='item item-borderless'>";
					if (position.userNickname !== null) {
						contentString = contentString + "<h3>"+position.userNickname+"</h3>";
					} else {
						contentString = contentString + "<h3>"+$scope.label_logout+"</h3>";
					}
					if (position.lastUpdate !== null) contentString = contentString + "<p>"+dateFormat(position.lastUpdate)+"</p>";
					contentString = contentString + "</div></span>";
					$scope.markersMap.push({
						layer: 'usersPositions',
			            lat: parseFloat(position.latitude),
			            lng: parseFloat(position.longitude),
			            clickable: true,
			            message: contentString,
			            keyboard: false,
			            icon: {
				            iconUrl: 'img/markers/marker-user.png',
				            shadowUrl: 'img/markers/marker-shadow.png',
							iconSize:     [30, 36], // size of the icon
							shadowSize:   [36, 36], // size of the shadow
							iconAnchor:   [18, 35], // point of the icon which will correspond to marker's location
							shadowAnchor: [18, 34],  // the same for the shadow
			            	labelAnchor: [11, -20] // as I want the label to appear 2px past the icon (iconAnchor.x + 2 - 6), 6 is Label padding
				        }
			        });
			    });
			}, function(error) {
				$ionicPopup.alert({
					title: $scope.errore,
					template: $scope.error_server
				});
				$scope.usersPositions = false;
			});
		} else {
			for (var i = $scope.markersMap.length - 1; i >= 0; i--) {
			    if ($scope.markersMap[i].layer === 'usersPositions') {
			       $scope.markersMap.splice(i, 1);
			    }
			}
		}
	};
	$scope.goDetail = function(stopId){
		//alert("stopId: "+stopId);
		$ionicLoading.show({hideOnStateChange: true});
		$scope.db.readTransaction(function(tx) {
			tx.executeSql('SELECT stop_id as stopId, longitude, latitude, longitude_deg as longitudeDeg, latitude_deg as latitudeDeg, type_id as typeId, inserted, inserted_by_user as insertedByUser, modified, modified_by_user as modifiedByUser, description, tot_preferito as totPreferito, rating, foto_path as fotoPath, homepage, valuta, prezzo_notturno as prezzoNotturno, prezzo_orario as prezzoOrario, prezzo_giornaliero as prezzoGiornaliero, prezzo_settimanale as prezzoSettimanale, prezzo_particolare as prezzoParticolare, acqua, scarico_cassetta as scaricoCassetta, scarico_pozzetto as scaricoPozzetto, prezzo_service as prezzoService, tipo_piazzola as tipoPiazzola, corrente, prezzo_corrente as prezzoCorrente, custodito as accessoCustodito, videosorveglianza, notte, illuminazione, ombra, docce, bagni, bambini, picnic, animali, fermata, wifi, locality, nation, telefono, posti, max_hh as maxHH, chiusura, distance FROM stop_points WHERE stop_id = ?', [stopId], function (t, res) {
				//alert("res.rows.length: "+res.rows.length);
				var stopPoint = res.rows.item(0);
				var preferito = false;
    			var howRated = null;
				if (res.rows.length > 0) {
    				tx.executeSql("SELECT stop_id as stopId, user_id as userId, rating, review, modified FROM users_reviews WHERE stopId = ? AND review IS NOT NULL AND review != '' ORDER BY modified DESC ", [stopId], function (tx, reviews) {
    					if (reviews.rows.length > 0) {
    						stopPoint.reviews = [];
	    					for (var i = 0; i < reviews.rows.length; i++) {
	    						stopPoint.reviews.push(reviews.rows.item(i));
							}
	    	            }
    					if ($scope.$storage.user != null) {
    						tx.executeSql('SELECT * FROM users_preferiti WHERE stop_id = ? and user_id = ?', [stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId], function (tx, preferiti) {
	        					if (preferiti.rows.length > 0) {
			    					preferito = true;
			    	            }
		        				tx.executeSql('SELECT * FROM users_reviews WHERE stop_id = ? and user_id = ?', [stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId], function (tx, ratings) {
		        					if (ratings.rows.length > 0) {
				    					howRated = ratings.rows.item(0).rating;
				    	            }
		    						$state.go('detail', {stopPoint: stopPoint, preferito: preferito, howRated: howRated});
				    			});
			    			});
    					} else {
        					$state.go('detail', {stopPoint: stopPoint, preferito: preferito, howRated: howRated});
    					}
	    			});
				} else {
					$ionicLoading.hide();
					$ionicPopup.alert({
						title: $scope.errore,
						template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
					});
				}
   			});
		}, function (err) {
			$ionicLoading.hide();
			$ionicPopup.alert({
				title: $scope.errore,
				template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
			});
   		});
	};

	if ($scope.$storage.mapsSetting == 1 && isOnline()) {
		$scope.defaultsMap.minZoom = 10;
		$scope.defaultsMap.maxZoom = 16;
		$scope.defaultsMap.mapTypeControl = true;
		$scope.definedLayers = {
			googleHybrid: {
				name: 'Google Hybrid',
				layerType: 'ROADMAP',
				type: 'google'
			}
		};
		angular.forEach($scope.stopPoints, function(stoppointsbo, i) {
			var contentString = "<span><a href='' class='item item-icon-right item-borderless' ng-click='goDetail("+stoppointsbo.stopId+")'><h3>"+stoppointsbo.description+"</h3><p>"+stoppointsbo.locality+"</p><i class='icon fill-icon ion-chevron-right'></i></a></span>";
			$scope.markersMap.push({
				layer: 'stopPoint',
	            lat: parseFloat(stoppointsbo.latitude),
	            lng: parseFloat(stoppointsbo.longitude),
	            clickable: true,
	            message: contentString,
	            getMessageScope: function() {return $scope; },
	            keyboard: false,
		        icon: {
		            iconUrl: 'img/markers/'+stoppointsbo.typeId+'_pin.png',
			        shadowUrl: 'img/markers/marker-shadow.png',
					iconSize:     [30, 41], // size of the icon
					shadowSize:   [41, 41], // size of the shadow
					iconAnchor:   [15, 40], // point of the icon which will correspond to marker's location
					shadowAnchor: [15, 39],  // the same for the shadow
					labelAnchor: [11, -20] // as I want the label to appear 2px past the icon (iconAnchor.x + 2 - 6), 6 is Label padding
		        }
		    });
	    });
		// Loads google map script
	    loadGoogleMapAPI.then(function () {
	        var baselayers = $scope.layersMap.baselayers;
	        baselayers['googleHybrid'] = $scope.definedLayers['googleHybrid'];
	    }, function () {
	        // Promise rejected
	    });
   	} else {
		$scope.defaultsMap.minZoom = 12;
		$scope.defaultsMap.maxZoom = 13;
		var baselayers = $scope.layersMap.baselayers;
		if (baselayers.hasOwnProperty('googleHybrid')) {
            delete baselayers['googleHybrid'];
        }
		angular.forEach($scope.stopPoints, function(stoppointsbo, i) {
			var contentString = "<span><a href='' class='item item-icon-right item-borderless' ng-click='goDetail("+stoppointsbo.stopId+")'><h3>"+stoppointsbo.description+"</h3><p>"+stoppointsbo.locality+"</p><i class='icon fill-icon ion-chevron-right'></i></a></span>";
			$scope.markersMap.push({
				layer: 'stopPoint',
	            lat: parseFloat(stoppointsbo.latitude),
	            lng: parseFloat(stoppointsbo.longitude),
	            clickable: true,
	            message: contentString,
	            getMessageScope: function() {return $scope; },
	            keyboard: false,
	            icon: {
		            iconUrl: 'img/markers/'+stoppointsbo.typeId+'_pin.png',
		            shadowUrl: 'img/markers/marker-shadow.png',
					iconSize:     [30, 41], // size of the icon
					shadowSize:   [41, 41], // size of the shadow
					iconAnchor:   [15, 40], // point of the icon which will correspond to marker's location
					shadowAnchor: [15, 39],  // the same for the shadow
	            	labelAnchor: [11, -20] // as I want the label to appear 2px past the icon (iconAnchor.x + 2 - 6), 6 is Label padding
		        }
	        });
	    });
		leafletData.getMap().then(function(searchedMap) {
			var tilesMap = new L.TileLayer.MBTiles(
					'', 
					{
				        minZoom: 12,
						maxZoom: 13,
						maxNativeZoom: 12,
				        tms: true,
				        errorTileUrl: '/img/no_tile.png'
				    },
				    $scope.dbTiles);
			searchedMap.addLayer(tilesMap);
	    });
	}
	if ($scope.usersPositions && isOnline()) {
		var range = parseFloat(parseFloat($scope.$storage.distanza)/100);
		var lat = parseFloat($scope.stopPoints[0].latitude);
    	var lng = parseFloat($scope.stopPoints[0].longitude);
		var boundToUrlValue = coordsToUrlValue(lat-range, lng-range, lat+range, lng+range);
		$http({
		    method: 'GET',
		    url: 'http://www.campersites.info:8082/positions/bound/'+boundToUrlValue,
		    headers: {'Content-Type': 'application/json'}
		}).
		then(function(response) {
			angular.forEach(response.data, function(position, i) {
				var contentString = "<span><div class='item item-borderless'>";
				if (position.userNickname !== null) {
					contentString = contentString + "<h3>"+position.userNickname+"</h3>";
				} else {
					contentString = contentString + "<h3>"+$scope.label_logout+"</h3>";
				}
				if (position.lastUpdate !== null) contentString = contentString + "<p>"+dateFormat(position.lastUpdate)+"</p>";
				contentString = contentString + "</div></span>";
				$scope.markersMap.push({
					layer: 'usersPositions',
		            lat: parseFloat(position.latitude),
		            lng: parseFloat(position.longitude),
		            clickable: true,
		            message: contentString,
		            keyboard: false,
		            icon: {
			            iconUrl: 'img/markers/marker-user.png',
			            shadowUrl: 'img/markers/marker-shadow.png',
						iconSize:     [30, 36], // size of the icon
						shadowSize:   [36, 36], // size of the shadow
						iconAnchor:   [18, 35], // point of the icon which will correspond to marker's location
						shadowAnchor: [18, 34],  // the same for the shadow
		            	labelAnchor: [11, -20] // as I want the label to appear 2px past the icon (iconAnchor.x + 2 - 6), 6 is Label padding
			        }
		        });
		    });
		}, function(error) {
			$ionicPopup.alert({
				title: $scope.errore,
				template: $scope.error_server
			});
			$scope.usersPositions = false;
		});
	}
    ga_storage._trackPageview('/searchedMap', 'App SearchedMap - ' + version);
});
angular.module('campersites').controller('detailController', function($scope, $state, $rootScope, $stateParams, $http, $localStorage, $ionicLoading, $ionicPopup, $translate, $ionicPopover) {
	$translate(['error.errore', 'error.server', 'error.connessione', 'error.database', 'label.uploading']).then(function (translations) {
		$scope.errore = translations['error.errore'];
		$scope.error_server = translations['error.server'];
		$scope.error_connessione = translations['error.connessione'];
		$scope.error_database = translations['error.database'];
		$scope.label_uploading = translations['label.uploading'];
	});
	$scope.stopPoint = $stateParams.stopPoint;
	$scope.preferito = $stateParams.preferito;
	$scope.howRated = $stateParams.howRated;
	$scope.$storage = $localStorage;
	$scope.db = $rootScope.db;
	$scope.downloadPhotos = false;
	$scope.mapOnlineOK = false;
	$scope.photos = [];
	
	//alert("$scope.stopPoint: "+JSON.stringify($scope.stopPoint));

	$scope.getRating = function(){
		if ($scope.stopPoint.rating > 0) return Math.round(($scope.stopPoint.rating * 100) / 5);
		return 0;
	};

	$scope.scaricaFoto = function(stopId) {
		if (isOnline()) {
			$ionicLoading.show({hideOnStateChange: true});
			$http({
			    method: 'GET',
			    url: 'http://www.campersites.info/getJsonImagesInfo?stopPoint=' + stopId
			}).
			success(function(data, status) {
				if (data.length > 0) {
					$scope.downloadPhotos = data;
					$scope.noimage = false;
				} else {
					$scope.downloadPhotos = ['no_image'];
					$scope.noimage = true;
				}
				$ionicLoading.hide();
			}).
			error(function(data, status) {
				$ionicLoading.hide();
				$ionicPopup.alert({
					title: $scope.errore,
					template: $scope.error_server
				});
			});
		} else {
       		$ionicPopup.alert({
       			title: $scope.errore,
       			template: $scope.error_connessione
       		});
		}
	};
	$scope.mapOnline = function() {
		if (isOnline()) {
			$scope.mapOnlineOK = true;
		} else {
			$scope.mapOnlineOK = false;
       		$ionicPopup.alert({
       			title: $scope.errore,
       			template: $scope.error_connessione
       		});
		}
	};
	$scope.sendToNavigator = function(latitude, longitude) {
		var navigatore = $scope.$storage.navigatore;
		if (device.platform === 'Android') {
			switch (navigatore) {
			case 'Google Maps':
				window.plugins.webintent.startActivity({
				    action: window.plugins.webintent.ACTION_VIEW,
				    url: 'http://maps.google.com/maps?daddr='+latitude+','+longitude
				});
				break;
			case 'Sygic':
				window.plugins.webintent.startActivity({
				    action: window.plugins.webintent.ACTION_VIEW,
				    url: 'com.sygic.aura://coordinate|'+longitude+'|'+latitude+'|drive'
				});
				break;
			case 'Navigon':
				window.plugins.webintent.sendBroadcast({
		            action: '"android.intent.action.navigon.START_PUBLIC',
		            extras: {
		                'latitude': parseFloat(latitude),
		                'longitude': parseFloat(longitude)
		            }
		        });
				break;
			case 'TomTom':
				window.plugins.webintent.startActivity({
				    action: window.plugins.webintent.ACTION_VIEW,
				    url: 'tomtomhome://geo:action=show&lat='+latitude+'&long='+longitude+'&name=CamperSites'
				});
				break;
			case 'Altro':
			default:
				window.plugins.webintent.startActivity({
				    action: window.plugins.webintent.ACTION_VIEW,
				    url: 'geo:'+latitude+','+longitude+'?q='+latitude+','+longitude
				});
				break;
			}
		} else if (device.platform === 'iOS') {
			switch (navigatore) {
			case 'Google Maps':
				window.open('comgooglemaps://?daddr='+latitude+','+longitude+'&directionsmode=driving', '_system');
				break;
			case 'Sygic':
				window.open('com.sygic.aura://coordinate|'+longitude+'|'+latitude+'|drive', '_system');
				break;
			case 'Navigon':
				window.open('navigon://coordinate/CamperSites/'+longitude+'/'+latitude, '_system');
				break;
			case 'TomTom':
				window.open('tomtomhome://geo:action=show&lat='+latitude+'&long='+longitude+'&name=CamperSites', '_system');
				break;
			case 'Altro':
			default:
				window.open('maps://'+latitude+','+longitude, '_system');
				break;
			}
		} else {
			window.open('geo:'+latitude+','+longitude, '_system');
		}
	};
	$scope.toShare = function() {
		window.plugins.socialsharing.share(null, null, null, 'http://www.campersites.info/detail/'+$scope.stopPoint.stopId);
	};
	
	$scope.openedBrowser = null;
	$scope.openBrowser = function (url) {
		$scope.openedBrowser = window.open(url, '_system', 'location=yes');
		$scope.openedBrowser.addEventListener('exit', $scope.browserClose);
	};

	$scope.browserClose = function (event) {
		$scope.openedBrowser.removeEventListener('exit', $scope.browserClose);
		$scope.openedBrowser = null;
	};
	
	$scope.like = function() {
		$ionicLoading.show({hideOnStateChange: true});
		$scope.db.transaction(function (t) {
			var today = new Date();
			t.executeSql('INSERT OR REPLACE INTO users_reviews (stop_id, user_id, rating, review, modified) VALUES (?, ?, ?, (SELECT review FROM users_reviews WHERE stop_id = ? AND user_id = ?), ?)', [$scope.stopPoint.stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId, 5, $scope.stopPoint.stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId, today.getTime()], function (t, data) {
				if (isOnline()) {
					$http({
					    method: 'POST',
					    url: 'http://www.campersites.info/addLikeStopPointMobile/' + $scope.stopPoint.stopId + '/' + $scope.$storage.user.fbUserId + '/' + $scope.$storage.user.userId
					}).
					success(function(data, status) {
		            	if (data.esito === 'OK') {
		            		var rating = Number((data.stopPoint.rating).toFixed(2));
							$scope.stopPoint.rating = rating;
		            		$scope.db.transaction(function (t) {
		            			t.executeSql('UPDATE stop_points SET rating = ? WHERE stop_id = ?', [rating, $scope.stopPoint.stopId]);
		            		}, function (err) {
		            			$ionicLoading.hide();
		               		});
		            	}
						$scope.howRated = 5;
						$ionicLoading.hide();
					}).
					error(function(data, status) {
						$ionicLoading.hide();
						$ionicPopup.alert({
							title: $scope.errore,
							template: $scope.error_server
						});
			        });
				} else {
					$scope.db.transaction(function (t) {
						var today = new Date();
						t.executeSql('INSERT OR REPLACE INTO offline_events (stop_id, user_id, func, rating, review, modified) VALUES (?, ?, ?, ?, (SELECT review FROM users_reviews WHERE stop_id = ? AND user_id = ?), ?)',
							[$scope.stopPoint.stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId, 'REVIEW', 5, $scope.stopPoint.stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId, today.getTime()]);
					}, function (err) {
						$ionicLoading.hide();
						$ionicPopup.alert({
							title: $scope.errore,
							template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
						});
			   		});
					$scope.db.readTransaction(function (t) {
						t.executeSql('SELECT * FROM users_reviews WHERE stop_id = ? AND RATING IS NOT NULL', [$scope.stopPoint.stopId], function(t, reviews) {
							var rating = 0;
							for (var i = 0; i < reviews.length; i++) {
								rating = rating + reviews.rating;
							}
							rating = rating / reviews.length;
							rating = Number((data.stopPoint.rating).toFixed(2));
							$scope.stopPoint.rating = rating;
		            		$scope.db.transaction(function (t) {
		            			t.executeSql('UPDATE stop_points SET rating = ? WHERE stop_id = ?', [rating, $scope.stopPoint.stopId]);
		            		}, function (err) {
		            			$ionicLoading.hide();
		               		});
		    				$scope.howRated = 5;
		    				$ionicLoading.hide();
						});
					}, function (err) {
						$ionicLoading.hide();
			   		});
				}
			});
		}, function (err) {
			$ionicLoading.hide();
			$ionicPopup.alert({
				title: $scope.errore,
				template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
			});
   		});
    };
	$scope.unLike = function() {
		$ionicLoading.show({hideOnStateChange: true});
		$scope.db.transaction(function (t) {
			var today = new Date();
			t.executeSql('INSERT OR REPLACE INTO users_reviews (stop_id, user_id, rating, review, modified) VALUES (?, ?, ?, (SELECT review FROM users_reviews WHERE stop_id = ? AND user_id = ?), ?)', [$scope.stopPoint.stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId, 0, $scope.stopPoint.stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId, today.getTime()], function (t, data) {
				if (isOnline()) {
					$http({
					    method: 'POST',
					    url: 'http://www.campersites.info/addUnLikeStopPoint/' + $scope.stopPoint.stopId + '/' + $scope.$storage.user.fbUserId + '/' + $scope.$storage.user.userId
					}).
					success(function(data, status) {
		            	if (data.esito === 'OK') {
		            		var rating = Number((data.stopPoint.rating).toFixed(2));
							$scope.stopPoint.rating = rating;
		            		$scope.db.transaction(function (t) {
		            			t.executeSql('UPDATE stop_points SET rating = ? WHERE stop_id = ?', [rating, $scope.stopPoint.stopId]);
		            		}, function (err) {
		            			$ionicLoading.hide();
		               		});
		            	}
						$scope.howRated = 0;
						$ionicLoading.hide();
					}).
					error(function(data, status) {
						$ionicLoading.hide();
						$ionicPopup.alert({
							title: $scope.errore,
							template: $scope.error_server
						});
			        });
				} else {
					$scope.db.transaction(function (t) {
						var today = new Date();
						t.executeSql('INSERT OR REPLACE INTO offline_events (stop_id, user_id, func, rating, review, modified) VALUES (?, ?, ?, ?, (SELECT review FROM users_reviews WHERE stop_id = ? AND user_id = ?), ?)',
							[$scope.stopPoint.stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId, 'REVIEW', 0, $scope.stopPoint.stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId, today.getTime()]);
					}, function (err) {
						$ionicLoading.hide();
						$ionicPopup.alert({
							title: $scope.errore,
							template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
						});
			   		});
					$scope.db.readTransaction(function (t) {
						t.executeSql('SELECT * FROM users_reviews WHERE stop_id = ? AND RATING IS NOT NULL', [$scope.stopPoint.stopId], function(t, reviews) {
							var rating = 0;
							for (var i = 0; i < reviews.length; i++) {
								rating = rating + reviews.rating;
							}
							rating = rating / reviews.length;
							rating = Number((data.stopPoint.rating).toFixed(2));
							$scope.stopPoint.rating = rating;
		            		$scope.db.transaction(function (t) {
		            			t.executeSql('UPDATE stop_points SET rating = ? WHERE stop_id = ?', [rating, $scope.stopPoint.stopId]);
		            		}, function (err) {
		            			$ionicLoading.hide();
		               		});
		    				$scope.howRated = 0;
		    				$ionicLoading.hide();
						});
					}, function (err) {
						$ionicLoading.hide();
			   		});
				}
			});
		}, function (err) {
			$ionicLoading.hide();
			$ionicPopup.alert({
				title: $scope.errore,
				template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
			});
   		});
	};
	$scope.addRemovePreferiti = function() {
		$ionicLoading.show({hideOnStateChange: true});
		if ($scope.preferito) {
			$scope.db.transaction(function (t) {
				t.executeSql('DELETE FROM users_preferiti WHERE stop_id = ? AND user_id = ?', [$scope.stopPoint.stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId]);
			}, function (err) {
				$ionicLoading.hide();
				$ionicPopup.alert({
					title: $scope.errore,
					template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
				});
	   		});
		} else {
			$scope.db.transaction(function (t) {
				var today = new Date();
				t.executeSql('INSERT INTO users_preferiti (stop_id, user_id, modified) VALUES (?, ?, ?)', [$scope.stopPoint.stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId, today.getTime()]);
			}, function (err) {
				$ionicLoading.hide();
				$ionicPopup.alert({
					title: $scope.errore,
					template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
				});
	   		});
		}
		if (isOnline()) {
			$http({
				method: 'POST',
		    	url: 'http://www.campersites.info:8082/stoppoints/preferito/' + $scope.stopPoint.stopId,
			    headers: {'X-User': $scope.$storage.user.userId}
		    }).
		    then(function(response) {
				$scope.stopPoint = response.data;
				if ($scope.preferito) {
					$scope.preferito = false;
				} else {
					$scope.preferito = true;
				}
        		$scope.db.transaction(function (t) {
        			t.executeSql('UPDATE stop_points SET tot_preferito = ? WHERE stop_id = ?', [$scope.stopPoint.totPreferito, $scope.stopPoint.stopId]);
        		}, function (err) {
        			$ionicLoading.hide();
           		});
				$ionicLoading.hide();
		    }, function(response) {
				$ionicLoading.hide();
				$ionicPopup.alert({
					title: $scope.errore,
					template: $scope.error_server
				});
			});
		} else {
			if ($scope.preferito) {
				$scope.db.transaction(function (t) {
					var today = new Date();
					t.executeSql('INSERT OR REPLACE INTO offline_events (stop_id, user_id, func, modified) VALUES (?, ?, ?, ?)',
						[$scope.stopPoint.stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId, 'DEL_PREF', today.getTime()]);
					$scope.stopPoint.totPreferito = $scope.stopPoint.totPreferito - 1;
					$scope.preferito = false;
	        		$scope.db.transaction(function (t) {
	        			t.executeSql('UPDATE stop_points SET tot_preferito = ? WHERE stop_id = ?', [$scope.stopPoint.totPreferito, $scope.stopPoint.stopId]);
	        		}, function (err) {
	        			$ionicLoading.hide();
	           		});
					$ionicLoading.hide();
				}, function (err) {
					$ionicLoading.hide();
					$ionicPopup.alert({
						title: $scope.errore,
						template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
					});
		   		});
			} else {
				$scope.db.transaction(function (t) {
					var today = new Date();
					t.executeSql('INSERT OR REPLACE INTO offline_events (stop_id, user_id, func, modified) VALUES (?, ?, ?, ?)',
						[$scope.stopPoint.stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId, 'ADD_PREF', today.getTime()]);
					$scope.stopPoint.totPreferito = $scope.stopPoint.totPreferito + 1;
					$scope.preferito = true;
	        		$scope.db.transaction(function (t) {
	        			t.executeSql('UPDATE stop_points SET tot_preferito = ? WHERE stop_id = ?', [$scope.stopPoint.totPreferito, $scope.stopPoint.stopId]);
	        		}, function (err) {
	        			$ionicLoading.hide();
	           		});
					$ionicLoading.hide();
				}, function (err) {
					$ionicLoading.hide();
					$ionicPopup.alert({
						title: $scope.errore,
						template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
					});
		   		});
			}
		}
	};

	$ionicPopover.fromTemplateUrl('templates/choosePhoto.html', {
		scope: $scope
	}).then(function(popover) {
		$scope.choosePhoto = popover;
	});
	$scope.addPhoto = function($event) {
		$scope.choosePhoto.show($event);
	};
	$scope.takePhoto = function() {
		$scope.workPhoto(Camera.PictureSourceType.CAMERA);
	};
	$scope.useExistingPhoto = function() {
		$scope.workPhoto(Camera.PictureSourceType.SAVEDPHOTOALBUM);
	};
	$scope.workPhoto = function(sourceType) {
		$scope.choosePhoto.hide();
		$ionicLoading.show({hideOnStateChange: true});
    	navigator.camera.getPicture($scope.onCaptureSuccess,
    	function(err) {
			$ionicLoading.hide();
			$ionicPopup.alert({
				title: $scope.errore,
				template: $scope.error_server + " (" + err.code + ", " + err.message + ") "
			});
        }, {
    		quality: 75,
    		destinationType: Camera.DestinationType.FILE_URI,
    		sourceType: sourceType,
    		encodingType: Camera.EncodingType.PNG,
    		correctOrientation: true
    	});
    };
    $scope.onCaptureSuccess = function(imageURI) {
		if (isOnline()) {
	    	var ft = new FileTransfer();
	    	var options = new FileUploadOptions();
	    	options.fileKey = "my_image";
	    	options.fileName = "myphoto.png";
	    	options.mimeType = "image/png";
			if (device.platform != 'Win32NT') {
				$scope.progressTotal = 0;
				$scope.progressLoaded = 0;
				$scope.loaded = 0;
				ft.onprogress = function (progressEvent) {
					if (progressEvent.lengthComputable) {
						$ionicLoading.show({hideOnStateChange: true, template: '<p><progress max="'+$scope.progressTotal+'" value="'+$scope.progressLoaded+'"></progress></p><p>'+$scope.label_uploading+' '+$scope.loaded+'%</p>'});
						$scope.progressTotal = progressEvent.total;
						$scope.progressLoaded = progressEvent.loaded;
						$scope.loaded = Math.ceil(progressEvent.loaded / progressEvent.total * 100);
					}
				};
			}					
	    	ft.upload(imageURI, encodeURI('http://www.campersites.info/uploadImageMobile/' + $scope.stopPoint.stopId + '/' + $scope.$storage.user.fbUserId + '/' + $scope.$storage.user.userId),
	        	function(response) {
	    			$ionicLoading.hide();
		    	},
		    	function(error) {
					$ionicLoading.hide();
					$ionicPopup.alert({
						title: $scope.errore,
						template: $scope.error_server + " (" + err.code + ", " + err.message + ") "
					});
		    	},
	        	options
	        );
		} else {
			$ionicLoading.hide();
	   		$ionicPopup.alert({
	   			title: $scope.errore,
	   			template: $scope.error_connessione
	   		});
		}
	};
	
	$scope.addReview = function() {
		$state.go('review', {stopId: $scope.stopPoint.stopId});
	};

	$scope.doModify = function() {
		$state.go('modifyArea', {stopPoint: $scope.stopPoint, preferito: $scope.preferito, howRated: $scope.howRated});
	};

	$scope.$on('$destroy', function() {
		$scope.choosePhoto.remove();
	});
    ga_storage._trackPageview('/detail/'+$scope.stopPoint.nation, 'App Detail - ' + version);
});
angular.module('campersites').controller('detailMapController', function($scope, $state, $ionicLoading, $ionicPopup, loadGoogleMapAPI) {
	$scope.definedLayers = {
		googleHybrid: {
			name: 'Google Hybrid',
			layerType: 'HYBRID',
			type: 'google'
		}
	};
	angular.extend($scope, {
	    defaultsMap: {
			minZoom: 12,
			maxZoom: 18,
	        disableDoubleClickZoom: true,
			dragging: true,
			touchZoom: true,
			scrollWheelZoom: false,
			doubleClickZoom: false,
			zoomControl: false,
			bounceAtZoomLimits: false
	    },
	    centerMap: {
	        lat: parseFloat($scope.stopPoint.latitude),
	        lng: parseFloat($scope.stopPoint.longitude),
	        zoom: 17
	    },
	    controlsMap: {
            scale: true
        },
        layersMap: {
            baselayers: {}
        },
        maxboundsMap: {
            northEast: {
                lat: 71.718882,
                lng: 46.318359
            },
            southWest: {
                lat: 33.358062,
                lng: -15.117188
            }
	    }
	});
	$scope.markersMap = new Array();
	$scope.markersMap.push({
           lat: parseFloat($scope.stopPoint.latitude),
           lng: parseFloat($scope.stopPoint.longitude),
           label: {
               message: $scope.stopPoint.description+' - '+$scope.stopPoint.locality,
               options: {
                   noHide: true,
                   direction: 'auto'
               }
           },
           icon: {
	            iconUrl: 'img/markers/'+$scope.stopPoint.typeId+'_pin.png',
	            shadowUrl: 'img/markers/marker-shadow.png',
				iconSize:     [30, 41], // size of the icon
				shadowSize:   [41, 41], // size of the shadow
				iconAnchor:   [15, 40], // point of the icon which will correspond to marker's location
				shadowAnchor: [15, 39],  // the same for the shadow
				labelAnchor: [11, -20] // as I want the label to appear 2px past the icon (iconAnchor.x + 2 - 6), 6 is Label padding
           }
    });
	
	// Loads google map script
    loadGoogleMapAPI.then(function () {
        var baselayers = $scope.layersMap.baselayers;
        baselayers['googleHybrid'] = $scope.definedLayers['googleHybrid'];
    }, function () {
        // Promise rejected
    });
    ga_storage._trackPageview('/detailMap/'+$scope.stopPoint.nation, 'App DetailMap - ' + version);
});
angular.module('campersites').controller('reviewController', function($scope, $state, $rootScope, $stateParams, $http, $localStorage, $ionicLoading, $ionicPopup, $translate) {
	$translate(['error.errore', 'error.server', 'error.connessione', 'error.database', 'label.conferma', 'label.riuscito']).then(function (translations) {
		$scope.errore = translations['error.errore'];
		$scope.error_server = translations['error.server'];
		$scope.error_connessione = translations['error.connessione'];
		$scope.error_database = translations['error.database'];
		$scope.label_conferma = translations['label.conferma'];
		$scope.label_riuscito = translations['label.riuscito'];
	});
	$scope.stopId = $stateParams.stopId;
	$scope.$storage = $localStorage;
	$scope.db = $rootScope.db;
	$scope.newReview = {
		testo: null
	};
	
	$scope.confirmReview = function(form) {
		if (form.$valid) {
			$ionicLoading.show({hideOnStateChange: true});
			if (isOnline()) {
				$http({
					method: 'POST',
			    	url: 'http://www.campersites.info:8082/stoppoints/' + $scope.stopId + '/review',
			    	data: $scope.newReview,
				    headers: {'X-User': $scope.$storage.user.userId}
			    }).
			    then(function(response) {
					null;
			    }, function(response) {
            		$ionicLoading.hide();
            		$ionicPopup.alert({
            			title: $scope.errore,
            			template: $scope.error_server
            		});
				});
			} else {
				$scope.db.transaction(function (t) {
					var today = new Date();
					t.executeSql('INSERT OR REPLACE INTO offline_events (stop_id, user_id, func, rating, review, modified) VALUES (?, ?, ?, (SELECT rating FROM users_reviews WHERE stop_id = ? AND user_id = ?), ?, ?)',
						[$scope.stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId, 'REVIEW', $scope.stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId, $scope.newReview.testo, today.getTime()]);
				}, function (err) {
					$ionicLoading.hide();
					$ionicPopup.alert({
						title: $scope.errore,
						template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
					});
		   		});
			}
			$scope.db.transaction(function (t) {
				var today = new Date();
				t.executeSql('INSERT OR REPLACE INTO users_reviews (stop_id, user_id, rating, review, modified) VALUES (?, ?, (SELECT rating FROM users_reviews WHERE stop_id = ? AND user_id = ?), ?, ?)', [$scope.stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId, $scope.stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId, $scope.newReview.testo, today.getTime()]);
				$scope.db.readTransaction(function(tx) {
					tx.executeSql('SELECT stop_id as stopId, longitude, latitude, longitude_deg as longitudeDeg, latitude_deg as latitudeDeg, type_id as typeId, inserted, inserted_by_user as insertedByUser, modified, modified_by_user as modifiedByUser, description, tot_preferito as totPreferito, rating, foto_path as fotoPath, homepage, valuta, prezzo_notturno as prezzoNotturno, prezzo_orario as prezzoOrario, prezzo_giornaliero as prezzoGiornaliero, prezzo_settimanale as prezzoSettimanale, prezzo_particolare as prezzoParticolare, acqua, scarico_cassetta as scaricoCassetta, scarico_pozzetto as scaricoPozzetto, prezzo_service as prezzoService, tipo_piazzola as tipoPiazzola, corrente, prezzo_corrente as prezzoCorrente, custodito as accessoCustodito, videosorveglianza, notte, illuminazione, ombra, docce, bagni, bambini, picnic, animali, fermata, wifi, locality, nation, telefono, posti, max_hh as maxHH, chiusura, distance FROM stop_points WHERE stop_id = ?', [$scope.stopId], function (tx, res) {
						var stopPoint = res.rows.item(0);
						var preferito = false;
		    			var howRated = null;
						if (res.rows.length > 0) {
		    				tx.executeSql("SELECT stop_id as stopId, user_id as userId, rating, review, modified FROM users_reviews WHERE stopId = ? AND review IS NOT NULL AND review != '' ORDER BY modified DESC ", [$scope.stopId], function (tx, reviews) {
		    					if (reviews.rows.length > 0) {
		    						stopPoint.reviews = [];
			    					for (var i = 0; i < reviews.rows.length; i++) {
			    						stopPoint.reviews.push(reviews.rows.item(i));
									}
			    	            }
	    						tx.executeSql('SELECT * FROM users_preferiti WHERE stop_id = ? and user_id = ?', [$scope.stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId], function (tx, preferiti) {
		        					if (preferiti.rows.length > 0) {
				    					preferito = true;
				    	            }
			        				tx.executeSql('SELECT * FROM users_reviews WHERE stop_id = ? and user_id = ?', [$scope.stopId, $scope.$storage.user.userId != null ? $scope.$storage.user.userId : $scope.$storage.user.fbUserId], function (tx, ratings) {
			        					if (ratings.rows.length > 0) {
					    					howRated = ratings.rows.item(0).rating;
					    	            }
					    	       		$ionicPopup.alert({
					            			title: $scope.label_conferma,
					            			template: $scope.label_riuscito
					            		});
			    						$state.go('detail', {stopPoint: stopPoint, preferito: preferito, howRated: howRated}, {reload: true});
					    			});
				    			});
			    			});
						} else {
							$ionicLoading.hide();
							$ionicPopup.alert({
								title: $scope.errore,
								template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
							});
						}
		   			});
				}, function (err) {
					$ionicLoading.hide();
					$ionicPopup.alert({
						title: $scope.errore,
						template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
					});
		   		});
			}, function (err) {
				$ionicLoading.hide();
				$ionicPopup.alert({
					title: $scope.errore,
					template: $scope.error_database + " (" + err.code + ", " + err.message + ") "
				});
	   		});
		}
	};
	if (device.platform === 'Win32NT') {
	    $document.find('button').attr('data-tap-disabled', true);
	    $document.find('select').attr('data-tap-disabled', true);
	}
    ga_storage._trackPageview('/review', 'App Review - ' + version);
});
angular.module('campersites').controller('modifyAreaController', function($scope, $state, $rootScope, $stateParams, $http, $localStorage, $ionicLoading, $ionicPopup, $translate, $window, rilevaPosizione) {
	$scope.clientSideList = [];
	$translate(['error.errore', 'error.server', 'error.connessione', 'error.database', 'label.si', 'label.no', 'label.conferma', 'desc.modifyOK', 'label.posizionando', 'error.gps']).then(function (translations) {
		$scope.errore = translations['error.errore'];
		$scope.error_server = translations['error.server'];
		$scope.error_connessione = translations['error.connessione'];
		$scope.error_database = translations['error.database'];
		$scope.label_si = translations['label.si'];
		$scope.label_no = translations['label.no'];
		$scope.label_conferma = translations['label.conferma'];
		$scope.desc_modifyOK = translations['desc.modifyOK'];
		$scope.label_posizionando = translations['label.posizionando'];
		$scope.error_gps = translations['error.gps'];
		$scope.clientSideList = [{ text: '-', value: '' },
		                         { text: $scope.label_si, value: 1 },
		                         { text: $scope.label_no, value: 0 }];
	});
	$scope.stopPoint = $stateParams.stopPoint;
	$scope.preferito = $stateParams.preferito;
	$scope.howRated = $stateParams.howRated;
	$scope.$storage = $localStorage;
	$scope.db = $rootScope.db;
	$scope.onlineOK = false;
	
	if ($scope.stopPoint.stopId != null) {
		for (var property in $scope.stopPoint) {
		    if ($scope.stopPoint.hasOwnProperty(property)) {
		        if (property != 'stopId' && property != 'reviews') {
		        	if ($scope.stopPoint[property] == null) {
		        		$scope.stopPoint[property] = '';
		        	}
		        }
		    }
		}
	}

	$scope.online = function() {
		if (isOnline()) {
			$scope.onlineOK = true;
		} else {
			$scope.onlineOK = false;
       		$ionicPopup.alert({
       			title: $scope.errore,
       			template: $scope.error_connessione
       		});
		}
	};
	$scope.modifyStopPoint = function(form) {
		if (form.$valid) {
			$ionicLoading.show({hideOnStateChange: true});
			if (isOnline()) {
				for (var property in $scope.stopPoint) {
			    	if ($scope.stopPoint.hasOwnProperty(property)) {
			        	if (property != 'stopId' && property != 'reviews' && property != 'photos') {
			        		if ($scope.stopPoint[property] === '') {
			        			$scope.stopPoint[property] = null;
			        		}
			        	}
			    	}
				}
				$http({
				    method: 'POST',
				    url: 'http://www.campersites.info:8082/stoppoints/',
				    data: $scope.stopPoint,
		    		headers: {'X-User': $scope.$storage.user.userId}
				}).
				then(function(response) {
	            		$ionicLoading.hide();
	            		$ionicPopup.alert({
	            			title: $scope.label_conferma,
	            			template: $scope.desc_modifyOK
	            		});
	            		$scope.stopPoint = response.data;
	            		$state.go('detail', {stopPoint: $scope.stopPoint, preferito: $scope.preferito, howRated: $scope.howRated}, {reload: true});
				}, function(response) {
					if (response.status === 400) {
						$ionicLoading.hide();
		        		$ionicPopup.alert({
		        			title: $scope.errore,
		        			template: $scope.error_server
		        		});
					} else {
						$ionicLoading.hide();
		        		$ionicPopup.alert({
		        			title: $scope.errore,
		        			template: $scope.error_server
		        		});
					}
				});
			} else {
				$ionicLoading.hide();
        		$ionicPopup.alert({
        			title: $scope.errore,
        			template: $scope.error_connessione
        		});
			}
		}
	};
	
	$scope.rilevaPosizione = function() {
		$ionicLoading.show({hideOnStateChange: true, template: '<p><ion-spinner></ion-spinner></p><p>'+$scope.label_posizionando+'</p>'});
		rilevaPosizione.exec().then(function(position) {
			$scope.stopPoint.latitude = position.coords.latitude;
			$scope.stopPoint.longitude = position.coords.longitude;
			$ionicLoading.hide();
		}, function (err) {
			$ionicLoading.hide();
			$ionicPopup.alert({
				title: $scope.errore,
				template: $scope.error_gps
			});
		});
	};
	if (device.platform === 'Win32NT') {
	    $document.find('button').attr('data-tap-disabled', true);
	    $document.find('select').attr('data-tap-disabled', true);
	}
	/*
	$scope.definedLayers = {
		googleHybrid: {
			name: 'Google Hybrid',
			layerType: 'HYBRID',
			type: 'google'
		}
	};
	angular.extend($scope, {
	    defaultsMap: {
			minZoom: 5,
			maxZoom: 18,
	        disableDoubleClickZoom: true,
			dragging: true,
			touchZoom: true,
			scrollWheelZoom: false,
			doubleClickZoom: false,
			zoomControl: false,
			bounceAtZoomLimits: false
	    },
	    layersMap: {
	        baselayers: {}
	    },
	    markersMap: {
	    	myStopPoint: {
	            lat: parseFloat($scope.stopPoint.latitude),
	            lng: parseFloat($scope.stopPoint.longitude),
	            draggable: true,
	            icon: {}
	            //icon: {
	            //iconUrl: 'img/markers/marker-icon.png',
	            //shadowUrl: 'img/markers/marker-shadow.png'
	 			//iconSize:     [38, 95], // size of the icon
	 			//shadowSize:   [50, 64], // size of the shadow
	 			//iconAnchor:   [22, 94], // point of the icon which will correspond to marker's location
	 			//shadowAnchor: [4, 62],  // the same for the shadow
	            //labelAnchor: [6, 0] // as I want the label to appear 2px past the icon (10 + 2 - 6)
	         	//}
	    	}
	    },
		centerMap: {
		    lat: parseFloat($scope.stopPoint.latitude),
		    lng: parseFloat($scope.stopPoint.longitude),
		    zoom: 16
		},
	    maxboundsMap: {
	        northEast: {
	            lat: 71.718882,
	            lng: 46.318359
	        },
	        southWest: {
	            lat: 33.358062,
	            lng: -15.117188
	        }
		}
	});
		
	// Loads google map script
	loadGoogleMapAPI.then(function () {
		var baselayers = $scope.layersMap.baselayers;
	    baselayers['googleHybrid'] = $scope.definedLayers['googleHybrid'];

	    $scope.findLocation = function (location) {
	    	alert(JSON.stringify(location));
	    	var geocoder = new google.maps.Geocoder();
	    	geocoder.geocode ({'location': location}, function(results, status) {
	    		alert(JSON.stringify(results));
	    		if (status == google.maps.GeocoderStatus.OK) {
	    			var strada = '';
	    			var luogo = '';
	    			var admin_3 = '';
	    			var admin_2 = '';
	    			angular.forEach(results[0].address_components, function(v, i) {
	    				if (v.types[0] == "route") {
	    					strada = v.long_name;
	    				} else if (v.types[0] == "locality") {
	    					luogo = v.long_name;
	    				} else if (v.types[0] == "administrative_area_level_3") {
	    					admin_3 = v.long_name;
	    				}  else if (v.types[0] == "administrative_area_level_2") {
	    					admin_2 = v.long_name;
	    				} else if (v.types[0] == "country") {
		    				$scope.stopPoint.nation = v.short_name;
	    				}
	    			});
	    			if (strada != '') {
	    				$scope.stopPoint.description = strada;
	    			}
	    			if (luogo != '') {
	    				$scope.stopPoint.locality = luogo;
	    			} else if (admin_3 != '') {
	    				$scope.stopPoint.locality = admin_3;
	    			} else if (admin_2 != '') {
	    				$scope.stopPoint.locality = admin_2;
	    			} 
	    		}
	    	});
	    };
	}, function () {
		// Promise rejected
	});
	*/
    ga_storage._trackPageview('/modify/'+$scope.stopPoint.stopId, 'App Modify - ' + version);
});

// Services
angular.module('campersites').service('getStopPointsService', function ($q, $rootScope, $localStorage) {
	var db = $rootScope.db;
	var stopPointsList = [];
	
	this.getByLatLang = function(latLang) {
		var deferred = $q.defer();
		var distanza = parseFloat($localStorage.distanza);
		var range = parseFloat(distanza/100);
		var latitude = parseFloat(latLang.latitude);
		var longitude = parseFloat(latLang.longitude);
		stopPointsList = [];
		//alert("db: "+db);
		//alert("distanza: "+distanza);
		db.readTransaction(function(tx) {
			tx.executeSql('SELECT stop_id as stopId, longitude, latitude, longitude_deg as longitudeDeg, latitude_deg as latitudeDeg, type_id as typeId, inserted, inserted_by_user as insertedByUser, modified, modified_by_user as modifiedByUser, description, tot_preferito as totPreferito, rating, foto_path as fotoPath, homepage, valuta, prezzo_notturno as prezzoNotturno, prezzo_orario as prezzoOrario, prezzo_giornaliero as prezzoGiornaliero, prezzo_settimanale as prezzoSettimanale, prezzo_particolare as prezzoParticolare, acqua, scarico_cassetta as scaricoCassetta, scarico_pozzetto as scaricoPozzetto, prezzo_service as prezzoService, tipo_piazzola as tipoPiazzola, corrente, prezzo_corrente as prezzoCorrente, custodito as accessoCustodito, videosorveglianza, notte, illuminazione, ombra, docce, bagni, bambini, picnic, animali, fermata, wifi, locality, nation, telefono, posti, max_hh as maxHH, chiusura, distance FROM stop_points WHERE (CAST(latitude AS REAL) BETWEEN CAST(? AS REAL) AND CAST(? AS REAL)) AND (CAST(longitude AS REAL) BETWEEN CAST(? AS REAL) AND CAST(? AS REAL))', [(latitude-range).toFixed(6), (latitude+range).toFixed(6), (longitude-range).toFixed(6), (longitude+range).toFixed(6)], function (t, stopPoints) {
				//alert("stopPoints.rows.length: "+stopPoints.rows.length);
				for (var i = 0; i < stopPoints.rows.length; i++) {
	           		var distance = getDistanceFromLatLonInKm(latitude, longitude, stopPoints.rows.item(i).latitude, stopPoints.rows.item(i).longitude).toFixed(2);
	           		if (parseFloat(distance) <= parseFloat(distanza)) {
	            		stopPointsList.push(stopPoints.rows.item(i));
	            		stopPointsList[stopPointsList.length-1].distance = distance;
	           		}
	           	}
	           	if (stopPointsList.length > 0) {
	           		stopPointsList.sort(function(a, b) {return a.distance - b.distance;});
	           	}
	           	deferred.resolve(stopPointsList);
			});
		}, function (err) {
			deferred.reject(err);
		});
		return deferred.promise;
	};
});
//Lazy loading of Google Map API
angular.module('campersites').service('loadGoogleMapAPI', function ($window, $q) {
	var deferred = $q.defer();

	// Load Google map API script
	function loadScript() {
		// Use global document since Angular's $document is weak
		var script = document.createElement('script');
		script.src = 'http://maps.googleapis.com/maps/api/js?sensor=false&language='+localeApp+'&callback=initMap';
		document.body.appendChild(script);
	}

	// Script loaded callback, send resolve
	$window.initMap = function () {
		deferred.resolve();
	};

	loadScript();

	return deferred.promise;
});
angular.module('campersites').service('syncUserData', function ($http, $rootScope, $localStorage) {
	var db = $rootScope.db;
	var user = $localStorage.user;
	
	this.sync = function() {
		if (user != null && db != null) {
	    	var toSend = {};
	    	toSend.user = user;
	    	var events = [];
	    	db.readTransaction(function(t) {
	            t.executeSql("SELECT stop_id as stopId, user_id as userId, func, rating, review, modified FROM offline_events order by modified asc", [], function(t, event){
	            	if (event.rows.length > 0) {
		            	for (var i=0; i < event.rows.length; i++) {
		            		events.push(event.rows.item(i));
		                }
	            	}
	            	toSend.events = events;
					$http({
					    method: 'POST',
					    url: 'http://www.campersites.info/syncMobileOfflineEvents',
					    headers: {'Content-Type': 'application/json'},
					    data: JSON.stringify(toSend)
					}).
					success(function(data, status) {
                    	if (data.esito === 'OK' || data.esito == null) {
	                    	db.transaction(function (t) {
	                    		t.executeSql('DELETE FROM offline_events', []);
	                    	});
	    					$http({
	    					    method: 'GET',
	    					    url: 'http://www.campersites.info/getMobileStopPointsPreferiti?latitude=54.525961&longitude=15.255119&maxDistance=0&userFbId=' + user.fbUserId + '&userId=' + user.userId
	    					}).
	    					success(function(data, status) {
		                    	db.transaction(function (t) {
		                    		t.executeSql('DELETE FROM users_preferiti WHERE user_id = ?', [user.userId != null ? user.userId : user.fbUserId]);
		                    		db.transaction(function (t) {
		                    			var today = new Date();
		                    			angular.forEach(data, function(stoppointsbo, i) {
		                    				t.executeSql('INSERT INTO users_preferiti (stop_id, user_id, modified) VALUES (?, ?, ?)',
		                    					[stoppointsbo.stopId, user.userId != null ? user.userId : user.fbUserId, today.getTime()]);
		                    				t.executeSql('INSERT OR REPLACE INTO stop_points (stop_id, latitude, longitude, latitude_deg, longitude_deg, type_id, inserted, inserted_by_user, modified, modified_by_user, description, tot_preferito, rating, foto_path, homepage, valuta, prezzo_notturno, prezzo_orario, prezzo_giornaliero, prezzo_settimanale, prezzo_particolare, acqua, scarico_cassetta, scarico_pozzetto, prezzo_service, tipo_piazzola, corrente, prezzo_corrente, custodito, videosorveglianza, notte, illuminazione, ombra, docce, bagni, bambini, picnic, animali, fermata, wifi, locality, nation, telefono, posti, max_hh, chiusura) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
	                    						[stoppointsbo.stopId, stoppointsbo.latitude, stoppointsbo.longitude, stoppointsbo.latitudeDeg, stoppointsbo.longitudeDeg, stoppointsbo.typeId, stoppointsbo.inserted, stoppointsbo.insertedByUser, stoppointsbo.modified, stoppointsbo.modifiedByUser, stoppointsbo.description, stoppointsbo.totPreferito, stoppointsbo.rating, stoppointsbo.fotoPath, stoppointsbo.homepage, stoppointsbo.valuta, stoppointsbo.prezzoNotturno, stoppointsbo.prezzoOrario, stoppointsbo.prezzoGiornaliero, stoppointsbo.prezzoSettimanale, stoppointsbo.prezzoParticolare, stoppointsbo.acqua, stoppointsbo.scaricoCassetta, stoppointsbo.scaricoPozzetto, stoppointsbo.prezzoService, stoppointsbo.tipoPiazzola, stoppointsbo.corrente, stoppointsbo.prezzoCorrente, stoppointsbo.custodito, stoppointsbo.videosorveglianza, stoppointsbo.notte, stoppointsbo.illuminazione, stoppointsbo.ombra, stoppointsbo.docce, stoppointsbo.bagni, stoppointsbo.bambini, stoppointsbo.picnic, stoppointsbo.animali, stoppointsbo.fermata, stoppointsbo.wifi, stoppointsbo.locality, stoppointsbo.nation, stoppointsbo.telefono, stoppointsbo.posti, stoppointsbo.maxHH, stoppointsbo.chiusura]);
		                    			});
		                    		});
		                    	});
	    					});
	    					$http({
	    					    method: 'GET',
	    					    url: 'http://www.campersites.info/getMobileUserReviews?userFbId=' + user.fbUserId + '&userId=' + user.userId
	    					}).
	    					success(function(data, status) {
	                    		db.transaction(function (t) {
	                    			angular.forEach(data, function(reviewbo, i) {
	                    				t.executeSql('INSERT OR REPLACE INTO users_reviews (stop_id, user_id, rating, review, modified) VALUES (?, ?, ?, ?, ?)',
	                    					[reviewbo.stopId, user.userId != null ? user.userId : user.fbUserId, reviewbo.rating, reviewbo.review, reviewbo.inserted]);
	                    			});
	                    		});
	    					});
                    	}
					});
	            });
	    	});
		}
	};
});
angular.module('campersites').service('checkPermessiPosizione', function ($q) {
	
	this.exec = function() {
		var deferred = $q.defer();
		
		cordova.plugins.diagnostic.isLocationEnabled(function(enabled) {
		    if (enabled) {
				deferred.resolve(true);
		    } else {
		    	if (device.platform !== 'iOS') {
		    		cordova.plugins.diagnostic.switchToLocationSettings();
					deferred.resolve(true);
		    	} else {
		    		cordova.plugins.diagnostic.requestLocationAuthorization(function(status) {
						deferred.resolve(true);
					}, function(err){
						deferred.reject(err);
					}, 'always');
		    	}
		    }
		}, function(err) {
			deferred.reject(err);
		});
		return deferred.promise;
	};
});
angular.module('campersites').service('rilevaPosizione', function ($q, checkPermessiPosizione) {
	
	this.exec = function() {
		var deferred = $q.defer();
		
		checkPermessiPosizione.exec().then(function(enabled) {
		    if (enabled) {
				navigator.geolocation.getCurrentPosition(function (position) {
					deferred.resolve(position);
				}, function (err) {
					deferred.reject(err);
				}, {maximumAge: 180000, timeout: 15000, enableHighAccuracy: true});
		    } else {
				deferred.reject(null);
		    }
		}, function(err) {
			deferred.reject(err);
		});
		return deferred.promise;
	};
});
// BACKGROUND TRAKING POSITION
angular.module('campersites').service('sharingPosition', function ($q, $http, $localStorage, $ionicPopup, $translate, checkPermessiPosizione) {
	var user = $localStorage.user;
	var sharePosition = $localStorage.sharePosition;
	var label_positionShared = 'Posizione condivisa';
	$translate(['label.positionShared']).then(function (translations) {
		var label_positionShared = translations['label.positionShared'];
	});

	this.bootBackgroundGeoLocation = function() {
		var deferred = $q.defer();

	    /**
	    * This callback will be executed every time a geolocation is recorded in the background.
	    */
	    var callbackFn = function(location) {
	    	var nickname = null;
	      	var locale = localeApp;
	      	var userId = null;
	    	if (user != null && user != undefined) {
	    		nickname = user.nickname;
	      		locale = user.locale;
	      		userId = user.userId;
	      	}
	      	var data = {
	      		positionId: device.uuid,
				latitude: Number((location.latitude).toFixed(6)),
				longitude: Number((location.longitude).toFixed(6)),
				userNickname: nickname,
				userLocale: locale,
				userId: userId,
				deviceModel: device.model,
				devicePlatform: device.platform,
				deviceVersion: device.version
	       	};

	        // post to server
	        if (sharePosition && isOnline()) {
				$http({
				    method: 'POST',
				    url: 'http://www.campersites.info:8082/positions/',
				    headers: {'Content-Type': 'application/json'},
					data: JSON.stringify(data)
				}).
				then(function(response) {
					backgroundGeoLocation.finish();
	        		deferred.resolve(data);
				}, function(error) {
					backgroundGeoLocation.finish();
					deferred.reject(error);
				});
	        } else {
	            // Signal to the native code, which is running a background-thread, that it done and it can gracefully kill that thread.
	            backgroundGeoLocation.finish();
	            deferred.resolve(data);
	        }
	    };

		var failureFn = function(err) {
			deferred.reject(err);
		  	//console.log('BackgroundGeoLocation err', err);
		};

	    backgroundGeoLocation.configure(callbackFn, failureFn, {
			desiredAccuracy: 100,
			stationaryRadius: 100,
			debug: false, // <-- enable this hear sounds for background-geolocation life-cycle.
			distanceFilter: 1,
			stopOnTerminate: true, // <-- enable this to clear background location settings when the app terminates
			locationTimeout: 60,
			notificationTitle: 'CamperSites', // <-- android only
			notificationText: label_positionShared, // <-- android only
			notificationIconColor: '#387ef5',
			notificationIcon: 'csnotification',
			locationService: backgroundGeoLocation.service.ANDROID_FUSED_LOCATION, // <-- android only, or ANDROID_DISTANCE_FILTER
			activityType: 'AutomotiveNavigation',
			interval: 6000,
			fastestInterval: 1000,
			activitiesInterval: 2000
	    });

	    if (sharePosition == 1) {
   			checkPermessiPosizione.exec().then(function(enabled) {
			    if (enabled) {
				    backgroundGeoLocation.start();
			   		backgroundGeoLocation.changePace(true);
			    } else {
					deferred.reject(null);
			    }
			}, null);
	    }
	    return deferred.promise;
	};

	this.stopBackgroundGeoLocation = function() {
		backgroundGeoLocation.stop();
	};

	this.startBackgroundGeoLocation = function() {
		checkPermessiPosizione.exec().then(function(enabled) {
		    if (enabled) {
			    backgroundGeoLocation.start();
		   		backgroundGeoLocation.changePace(true);
		    }
		}, null);
	};
});

// Directives
angular.module('campersites').directive('sameAs', function () {
	return {
		require: 'ngModel',
		link:
			function (scope, elem, attrs, ngModel) {
				ngModel.$parsers.unshift(validate);
				// Force-trigger the parsing pipeline.
				scope.$watch(attrs.sameAs, function () {
					ngModel.$setViewValue(ngModel.$viewValue);
				});
				function validate(value) {
					var isValid = scope.$eval(attrs.sameAs) == value;
					ngModel.$setValidity('same-as', isValid);
					return isValid ? value : undefined;
				}
			}
	};
});

// Javascript utility functions
function dateFormat(date) {
	return moment(date).lang(localeApp).format('LL');
};

/*
var states = {};
states[Connection.UNKNOWN]  = 'Unknown connection';
states[Connection.ETHERNET] = 'Ethernet connection';
states[Connection.WIFI]     = 'WiFi connection';
states[Connection.CELL_2G]  = 'Cell 2G connection';
states[Connection.CELL_3G]  = 'Cell 3G connection';
states[Connection.CELL_4G]  = 'Cell 4G connection';
states[Connection.CELL]     = 'Cell generic connection';
states[Connection.NONE]     = 'No network connection';
*/
function isOnline() {
    return navigator.connection.type != Connection.NONE;
};

function getFirstBrowserLanguage() {
    var nav = window.navigator,
        browserLanguagePropertyKeys = ['language', 'browserLanguage', 'systemLanguage', 'userLanguage'],
        i,
        language;

    // support for HTML 5.1 "navigator.languages"
    if (angular.isArray(nav.languages)) {
      for (i = 0; i < nav.languages.length; i++) {
        language = nav.languages[i];
        if (language && language.length) {
          return language;
        }
      }
    }

    // support for other well known properties in browsers
    for (i = 0; i < browserLanguagePropertyKeys.length; i++) {
      language = nav[browserLanguagePropertyKeys[i]];
      if (language && language.length) {
        return language;
      }
    }

    return null;
};

function coordsToUrlValue(minLatitude, minLongitude, maxLatitude, maxLongitude) {
    return minLatitude + ',' + minLongitude + ',' + maxLatitude + ',' + maxLongitude;
};

function deg2rad(deg) {
    return deg * (Math.PI/180);
};

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  	var R = 6371; // Radius of the earth in km
  	var dLat = deg2rad(lat2-lat1);  // deg2rad below
   	var dLon = deg2rad(lon2-lon1);
   	var a = 
   		Math.sin(dLat/2) * Math.sin(dLat/2) +
   		Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
   		Math.sin(dLon/2) * Math.sin(dLon/2); 
   	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
   	var d = R * c; // Distance in km
   	return d;
};

function add(a, b, precision) {
	var x = Math.pow(10, precision || 2);
	return (Math.round(a * x) + Math.round(b * x)) / x;
};

function fileErrorHandler(e) {
	var msg = '';
	switch (e.code) {
	case FileError.QUOTA_EXCEEDED_ERR:
		msg = 'QUOTA_EXCEEDED_ERR';
		break;
	case FileError.NOT_FOUND_ERR:
		msg = 'NOT_FOUND_ERR';
		break;
	case FileError.SECURITY_ERR:
		msg = 'SECURITY_ERR';
		break;
	case FileError.INVALID_MODIFICATION_ERR:
		msg = 'INVALID_MODIFICATION_ERR';
		break;
	case FileError.INVALID_STATE_ERR:
		msg = 'INVALID_STATE_ERR';
		break;
	default:
		msg = 'Unknown Error';
		break;
	};
	return msg;
};

function fileTransferErrorHandler(e) {
	var msg = '';
	switch (e.code) {
	case FileTransferError.FILE_NOT_FOUND_ERR:
		msg = 'FILE_NOT_FOUND_ERR';
		break;
	case FileTransferError.INVALID_URL_ERR:
		msg = 'INVALID_URL_ERR';
		break;
	case FileTransferError.CONNECTION_ERR:
		msg = 'CONNECTION_ERR';
		break;
	case FileTransferError.ABORT_ERR:
		msg = 'ABORT_ERR';
		break;
	case FileTransferError.NOT_MODIFIED_ERR:
		msg = 'NOT_MODIFIED_ERR';
		break;
	default:
		msg = 'Unknown Error';
		break;
	};
	return msg;
};

function msToTime(duration) {
	//alert("duration: " + duration);
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? '0' + hours : hours;
    minutes = (minutes < 10) ? '0' + minutes : minutes;
    seconds = (seconds < 10) ? '0' + seconds : seconds;
    //alert(hours + ':' + minutes + ':' + seconds);
    return hours + ':' + minutes + ':' + seconds;
};

/*
function getBase64FromImageUrl(URL) {
    var img = new Image();
    img.src = URL;
    img.onload = function () {
	    var canvas = document.createElement("canvas");
	    canvas.width = this.width;
	    canvas.height = this.height;
	    var ctx = canvas.getContext("2d");
	    ctx.drawImage(this, 0, 0);
	    var dataURL = canvas.toDataURL("image/png");
	    console.log(dataURL.replace(/^data:image\/png;base64,/, ""));
    };
};
*/

// no_tile.png
var errorTile = 'data:image/png;base64,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';
var base64Prefix = 'data:image/gif;base64,';
function getTile(rows, z, x, y, toSuccess, toError) {
	//alert("resInfo.rows.length: " + resInfo.rows.length);
	if (rows.length > 0) {
		items = [];
	   	for (var i = 0; i < rows.length; i++) {
	   		items.push(rows.item(i));
	   	}
		getTileFromMultiDB(items, z, x, y, toSuccess, toError);
	} else {
		txTileInfo.executeSql('SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?', [z, x, y], function (txTile, res) {
			//alert("res.rows.length: " + res.rows.length);
			if (res.rows.length > 0) {
				//alert("tile.src: " + base64Prefix + res.rows.item(0).tile_data);
				toSuccess(res.rows.item(0));
			} else {
				toError();
			}
		}, function (err) {
			toError();
		});
	}
};

function getTileFromMultiDB(items, z, x, y, toSuccess, toError) {
	var nameDb = items.shift().tile_nation+'CamperSitesDbMaps.sqlite';
	if (nameDb) {	
		if (device.platform === 'iOS') {
			nameDb = "NoCloud/" + nameDb;
		}
		var dbFile = window.sqlitePlugin.openDatabase({name: nameDb, iosDatabaseLocation: 'Library', androidDatabaseImplementation: 2});
		//alert("dbFile opened: " + dbFile);
		dbFile.readTransaction(function(txTile) {
			txTile.executeSql('SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?', [z, x, y], function (txTile, res) {
				//alert("res.rows.length: " + res.rows.length);
				if (res.rows.length > 0) {
					//alert("tile.src: " + base64Prefix + res.rows.item(0).tile_data);
					toSuccess(res.rows.item(0));
				} else {
					getTileFromMultiDB(items, z, x, y, toSuccess, toError);
				}
			}, function (err) {
				toError();
			});
		}, function (err) {
			toError();
		});
	} else {
		toError();
	}
};

L.TileLayer.MBTiles = L.TileLayer.extend({
	mbTilesDB: null,
	initialize: function(url, options, db) {
		this.mbTilesDB = db;
		L.Util.setOptions(this, options);
	},
	_loadTile: function (tile, tilePoint) {
		tile._layer  = this;
		tile.onload  = this._tileOnLoad;
		tile.onerror = this._tileOnError;
		this._adjustTilePoint(tilePoint);
		var z = tilePoint.z;
		var x = tilePoint.x;
		var y = tilePoint.y;
		this.mbTilesDB.readTransaction(function(txTileInfo) {
			txTileInfo.executeSql('SELECT tile_nation FROM infotiles WHERE zoom_level = ? AND min_tile_column <= ? AND max_tile_column >= ? AND min_tile_row <= ? AND max_tile_row >= ?', [z, x, x, y, y], function (txTileInfo, resInfo) {
				getTile(resInfo.rows, z, x, y, function(item) {
					tile.src = base64Prefix + item.tile_data;
				}, function() {
					tile.src = errorTile;
				});
			}, function (err) {
				tile.src = errorTile;
			});
		}, function (err) {
			tile.src = errorTile;
		});
	}
});
