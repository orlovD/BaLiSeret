'use strict';
//Init controller
myApp.controller('myController', function($scope, $http, focusController, $timeout, $interval, ngProgressFactory) {
    //variables for image sources
    //get backIcon source image
    $scope.backIcon = "images/icon-back-reg.svg";
    //get homeIcon source image
    $scope.homeIcon = "images/home-button-reg.svg";
    $scope.backFromActorIcon = "images/icon-back-reg.svg";
    $scope.homeFromActorIcon = "images/home-button-reg.svg";
    $scope.playIcon = "images/play-regular.svg";
    $scope.playPauseButton = "images/pause-regular-player.svg";
    $scope.ffButton = "images/forward-regular-player.svg";
    $scope.bbButton = "images/backward-regular-player.svg";

    //variable for image sources on the main screen
    $scope.searchIcon = "images/icon-search.svg";
    $scope.sortArrowIcon = "images/icon-dropdown.svg";
    $scope.filterArrowIcon = "images/icon-dropdown.svg";

    //variable for image sources on movie info screen
    $scope.ratingIconDark = "images/stars-dark.svg";
    $scope.ratingIconLight = "images/stars.svg";

	/** tracking variables **/
    $scope.currentDepth = 0;
    $scope.lastDepth = 0;
    $scope.currentMovieInfo = 0;
    $scope.currentMovie = 0;
    $scope.currentActorID = 0;
    $scope.lastMovie = 0;
    $scope.overview = "";
	$scope.showControl = false;
	$scope.isTizen = false; //should be set to 'true' on Tizen devices
	var unregister; //for unregistering watches
    $scope.movieScreenReady = false;
    $scope.showSpinner = false;
    var showHideTimer;

	/** caph-lists variables **/
    $scope.movies = [];
    $scope.castList = [];
    $scope.recommendedMovies = [];
	$scope.actorsMovies = [];
	$scope.searchResults = [];

    /** sort variables **/
	$scope.voteCount = "&vote_count.gte=5&vote_average.gte=1"; //minimal vote_count
    $scope.sortingCriteria = "popularity.desc";
    $scope.sortValue = "סדר לפי";

    /** filter variables **/
    $scope.isAllMovieShown = true;
    $scope.filteringGenre = "";
    $scope.filterValue = "כל הסרטים";
    $scope.showMoreIcon = "images/icon-show-more.svg";
    //$scope.showMoreIcon1 = "images/icon-show-more1.svg";
    $scope.isGenreFocused = false;
    $scope.isLanguageFocused = false;
    $scope.filteringLanguage = "";
    $scope.filteringStartDate = "";
    $scope.filteringEndDate = "";
    $scope.filteringCriteria = "";
    $scope.votesThreshold = 100;

    /** search variables **/
    $scope.search = {};
    $scope.search.string = "...חיפוש לפי שם הסרט";
    //id of a movie to get info about
    $scope.searchID = undefined;
    //flag for IME focusing
    $scope.isImeFocused = false;

    /** trailer variables **/
    $scope.currentMovieID = undefined;
    //variable for youtube trailer ID
    $scope.trailerID = undefined;
    //player object handle
    $scope.trailerPlayer = undefined;
    //player parameters
    $scope.PLAYER = {
        controls: 0,
        autoplay: 1,
        rel: 0,
    };
    // progress bar parameters
	$scope.progressbar = ngProgressFactory.createInstance();
	$scope.progressbar.setParent(document.getElementById('progressBarContainer'));
	$scope.progressbar.setHeight('10px');
	$scope.progressbar.setColor('rgba(56, 211, 252,0.5)');
    var progress;
    $scope.isTrailerPlaying = false; //'true' when trailer is playing


    /** ERROR CONSTANTS **/
    $scope.ERROR = {
        UNKNOWN_ERROR: "Unknown Error Occurred",
        NO_MOVIES_FOUND: "לא נמצאו תוצאות",
        NO_STRING_ENTERED: "לא הוכנסה מילת חיפוש",
        TRAILER: "לא נמצא טריילר",
        NO_NETWORK: "לא נמצא חיבור לרשת"
    };

    /** error variables **/
    $scope.errorMessage = $scope.ERROR.UNKNOWN_ERROR;
    $scope.errorImage = "images/attention.PNG";

    /** DEPTH CONSTANTS **/
    $scope.DEPTH = {
        INDEX: 0,
        MOVIE_INFO: 1,
			PLOT_SCREEN: 11,
			TRAILER: 12,
			RECOMMENDED_MOVIES: 13,
			SCREENING_HOURS: 14,
			ACTOR_INFO: 15,
			ACTOR_BIO: 16,
			ACTOR_MOVIES: 17,
        SORT: 2,
        FILTER: 3,
        SEARCH: 4,
			SEARCH_RESULTS: 41,
        ERROR: 5
    };

    /** GENRE FILTERING CONSTANTS **/
    $scope.GENRE = {
        DRAMA: "&with_genres=18",
        COMEDY: "&with_genres=35",
        THRILLER: "&with_genres=53|28",
        KIDS: "&with_genres=10751",
        HORROR: "&with_genres=27",
        ANIMATION: "&with_genres=16",
        DOCUMENTARY: "&with_genres=99",
        ADVENTURE: "&with_genres=12",
        SCIFI: "&with_genres=878",
        CRIME: "&with_genres=80"
    };

    /** SORTING CONSTANTS **/
    $scope.SORTING = {
        DATEASC: "primary_release_date.asc",
        DATEDESC: "primary_release_date.desc",
        POPASC: "popularity.asc",
        POPDESC: "popularity.desc",
        //sort by user votes, show only movies that have votes from at least $scope.votesThreshold users
        VOTEASC: "vote_average.asc&vote_count.gte=" + $scope.votesThreshold,
        VOTEDESC: "vote_average.desc&vote_count.gte=" + $scope.votesThreshold,
        TITLEASC: "original_title.asc",
        TITLEDESC: "original_title.desc"
    };

    /*****************************************************************************
     * Add listener to remote control's keys when window is loaded
     * Gives an option to use 'return' key of the remote to exit to index screen
     * When 'return' used from index screen, the application will be terminated
     *****************************************************************************/
    window.onload = function() {
        if (window.tizen === undefined) {
        	$scope.isTizen = false;
            console.log('This application should be run on Tizen device');
            return;
        }else{
        	$scope.isTizen = true;
        }
        $scope.registerKeys();
        $scope.registerKeyHandler();
    };
    /***************************************************************************** 
	 * Enable element
     ****************************************************************************/
    $scope.enable = function(focusable){
    	focusController.enable(focusable);
    };
    /***************************************************************************** 
	 * Disable element
     ****************************************************************************/
    $scope.disable = function(focusable){
    	focusController.disable(focusable);
    };      
    /***************************************************************************** 
	 * Show introduction screen for 3 sec
     ****************************************************************************/
    $scope.showIntro = true; //should be enabled for introduction screen
    $timeout(function(){
        $scope.showIntro = false;
    }, 3000);
    /***************************************************************************** 
     * Request first page of movies from the content server
     * Select ufiltered data from the collection of all movies
     * The result is sorted by popularity in the descending order
     *****************************************************************************/
    $http.get("http://api.themoviedb.org/3/discover/movie?sort_by=popularity.desc&api_key=e88aa9ee18d8bb7b8395fd9fcc33cb39&language=he-IL&page=1"+$scope.voteCount).then(function(response) {
        $scope.myData = response.data.results;
        $scope.lastRetrievedPage = 1;
        $scope.totalPages = response.data.total_pages;
        var temp = [];
        for (var i = 0; i < $scope.myData.length; i++) {
            var releaseDate = new Date(response.data.results[i].release_date);
            var year = releaseDate.getFullYear();
            //error check - check if image exists
            var imgURL = "http://wonkville.net/wp-content/uploads/2016/04/No-image-available.jpg";
            if (response.data.results[i].poster_path !== null) {
                imgURL = "https://image.tmdb.org/t/p/w342" + response.data.results[i].poster_path;
            }
            temp.push({
                "text": response.data.results[i].title,
                //error check
                "image": imgURL,
                "year": year,
                "id": response.data.results[i].id
            });
        }
        //add new movies to $scope.movies
        $scope.movies = temp;
    });
    /***************************************************************************** 
     * Request next page of movies from the content server
     * Select filtered data accordingly to selected filtering option
     * The result is sorted accordingly to selected sorting option
     ****************************************************************************/
    $scope.getNextPage = function() {
        console.log("in getNextPage()");
        //check sortingCriteria and filteringCriteria and send appropriate request
        var request = "https://api.themoviedb.org/3/discover/movie?sort_by=" + $scope.sortingCriteria + "&api_key=e88aa9ee18d8bb7b8395fd9fcc33cb39" + $scope.filteringGenre + "&language=he-IL"+ $scope.voteCount +"&page=";
        if ($scope.filteringCriteria !== "") {
            request = "https://api.themoviedb.org/3/movie" + $scope.filteringCriteria + "?api_key=e88aa9ee18d8bb7b8395fd9fcc33cb39&sort_by=" + $scope.sortingCriteria + $scope.voteCount +"&language=he-IL&page=";
        }
        if ($scope.lastRetrievedPage < $scope.totalPages) {
            $http.get(request + (1 + $scope.lastRetrievedPage)).then(function(response2) {
                $scope.myData = response2.data.results;
                $scope.lastRetrievedPage++;
                var temp = [];
                for (var i = 0; i < $scope.myData.length; i++) {
                    var releaseDate = new Date(response2.data.results[i].release_date);
                    var year = releaseDate.getFullYear();
                    //error check - check if image exists
                    var imgURL = "images/placeholder.svg";
                    if (response2.data.results[i].poster_path !== null) {
                        imgURL = "https://image.tmdb.org/t/p/w342" + response2.data.results[i].poster_path;
                    }
                    temp.push({
                        "text": response2.data.results[i].title,
                        //error check
                        "image": imgURL,
                        "year": year,
                        "id": response2.data.results[i].id
                    });
                }
                //add new movies to $scope.movies
                $scope.movies = $scope.movies.concat(temp);
                console.log("entries_received is: " + temp.length);
            });
        }
    };
    /*****************************************************************************
     * Change search icon on focus
     ****************************************************************************/
    $scope.focusSearch = function() {
        angular.element('#searchButton').css('box-shadow', '0 0 15px 6px rgba(0, 200, 255, 0.5)');
    };
    /*****************************************************************************
     * Change search icon on blur
     ****************************************************************************/
    $scope.blurSearch = function() {
        angular.element('#searchButton').css('box-shadow', '');
    };
    /*****************************************************************************
     * Change sort icon on focus
     ****************************************************************************/
    $scope.focusSort = function() {
        $scope.sortArrowIcon = "images/icon-dropdown-selected.svg";
    };
    /*****************************************************************************
     * Change sort icon on blur
     ****************************************************************************/
    $scope.blurSort = function() {
        $scope.sortArrowIcon = "images/icon-dropdown.svg";
    };
    /*****************************************************************************
     * Change filter icon on focus
     ****************************************************************************/
    $scope.focusFilter = function() {
        $scope.filterArrowIcon = "images/icon-dropdown-selected.svg";
    };
    /*****************************************************************************
     * Change filter icon on blur
     ****************************************************************************/
    $scope.blurFilter = function() {
        $scope.filterArrowIcon = "images/icon-dropdown.svg";
    };
    /*****************************************************************************
     * Change back icon on focus
     ****************************************************************************/
    $scope.focusBack = function() {
        $scope.backIcon = "images/icon-back-hover.svg";
    };
    /*****************************************************************************
     * Change back icon on blur
     ****************************************************************************/
    $scope.blurBack = function() {
            $scope.backIcon = "images/icon-back-reg.svg";
        }
    /*****************************************************************************
     * Change home icon on focus
     ****************************************************************************/
    $scope.focusHome = function() {
        $scope.homeIcon = "images/home-button-selected.svg";
    };
    /*****************************************************************************
     * Change home icon on blur
     ****************************************************************************/
    $scope.blurHome = function() {
        $scope.homeIcon = "images/home-button-reg.svg";
    };
    /*****************************************************************************
     * Change show more icon on focus
     ****************************************************************************/
    $scope.focusShowMore = function() {
        $scope.showMoreIcon = "images/icon-show-more-selected.svg";
    };
    /*****************************************************************************
     * Change show more icon on blur
     ****************************************************************************/
    $scope.blurShowMore = function() {
        $scope.showMoreIcon = "images/icon-show-more.svg";
    };
    /*****************************************************************************
     * Launch screen with movie description and additional information
     * When movie screen is shown,
     * It is possible to watch trailer and actor information
     ****************************************************************************/
    $scope.launchMovieScreen = function(movieID){
		angular.element(document.getElementById("overview")).attr('data-overflowed', 'false');
    	var result = document.getElementById("overview");   	
    	$scope.enableScreenSaver();
        $scope.launchMovieScreen1(movieID);       
    };
    
	/* watch objects */
    $scope.$watch(
		function(scope){
			return $scope.currentDepth;
		},
		function(scope){
			console.log("scope.currentDepth: " + $scope.currentDepth);
    });

    $scope.$watch(function(scope){
    	if ($scope.isTizen){
        	return webapis.network.getActiveConnectionType();
    	}else{
    		return null;
    	}
    }, 
	function(scope){
    	if ($scope.isTizen){
        	var connection = webapis.network.getActiveConnectionType();
        	if (connection == webapis.network.NetworkActiveConnectionType.DISCONNECTED){
        		$scope.lastDepth = $scope.currentDepth;
        		changeDepth($scope.DEPTH.ERROR);
                $scope.errorMessage = $scope.ERROR.NO_NETWORK;
        	}else{
        		if ($scope.currentDepth == $scope.DEPTH.ERROR) 
        			$scope.errorMessage = "";
        			changeDepth($scope.lastDepth);
        	}
    	}
    });
    
    $scope.$watch(
    	function(scope){
    		return document.getElementById("overview").innerHTML;
    	},
    	function(scope){
    		console.log("------------inside $watch-----------");
    		console.log("$scope.currentMovie: " + $scope.currentMovie);
			console.log("$scope.lastMovie: " + $scope.lastMovie);
			console.log("document.getElementById('invisibleReadMore').style.display:" + document.getElementById("invisibleReadMore").style.display);
						
			var o_f = document.getElementById("overview").getAttribute("data-overflowed");
			console.log("o_f: " + o_f);	
			console.log("document.getElementById('overview').innerText: " + document.getElementById("overview").innerText);
			console.log("document.getElementById('overview').innerHTML: " + document.getElementById("overview").innerHTML);
				
			var overview = angular.element(document.getElementById('overview'));
			var overflow = overview[0].scrollHeight > overview[0].clientHeight;
			console.log("scrollHeight: " + overview[0].scrollHeight);
			console.log("clientHeight: " + overview[0].clientHeight);
			if ($scope.lastMovie != $scope.currentMovie && o_f=='true'){
   				$scope.lastMovie = $scope.currentMovie;
       			console.log("AAAAAAAAAA: overflow:");
       			console.log(overflow);
           		document.getElementById('invisibleReadMore').style.display = "block";
       			focusController.enable('readMore');
   			}
   			console.log("----------out $watch-----------");
   		}
    );
	
    $scope.$watch(
   		function(scope){
   			return document.getElementById("actorBio").innerHTML;
   		},
   		function(scope){
   			console.log("------------inside $watch-----------");
   			console.log("$scope.currentActorID: " + $scope.currentActorID);
			console.log("document.getElementById('invisibleReadMore2').style.display:" + document.getElementById("invisibleReadMore2").style.display);
					
			var o_f = document.getElementById("actorBio").getAttribute("data-overflowed");
			console.log("o_f: " + o_f);
				
			console.log("document.getElementById('actorBio').innerHTML: " + document.getElementById("actorBio").innerHTML);
				
			var actorBio = angular.element(document.getElementById('actorBio'));
			var overflow = actorBio[0].scrollHeight > actorBio[0].clientHeight;
			console.log("scrollHeight: " + actorBio[0].scrollHeight);
			console.log("clientHeight: " + actorBio[0].clientHeight);
			if (o_f=='true'){
       			console.log("AAAAAAAAAA: o_f:");
       			console.log(o_f);
       			console.log("AAAAAAAAAA: overflow:");
       			console.log(overflow);
           		document.getElementById('invisibleReadMore2').style.display = "block";
       			focusController.enable('invisibleReadMore2');
   			}else{
       			console.log("AAAAAAAAAA: o_f:");
       			console.log(o_f);
       			console.log("AAAAAAAAAA: overflow:");
       			console.log(overflow);
           		document.getElementById('invisibleReadMore2').style.display = "none";
       			focusController.enable('invisibleReadMore2');
   			}
   			console.log("----------out $watch-----------");
   		}
    );
       
    /*****************************************************************************
     * Process movie screen launch
     ****************************************************************************/
    $scope.launchMovieScreen1 = function(movieID) {
    	$scope.movieScreenReady = false;
    	$timeout(function(){
    		if (!$scope.movieScreenReady && $scope.currentDepth === $scope.DEPTH.INDEX){
    			$scope.showSpinner = true;
    		}
    	}, 500);
    	console.log("inside launchMovieScreen1");
    	if (movieID != $scope.currentMovie){
			console.log("$scope.currentMovie: " + $scope.currentMovie);
			console.log("movieID: " + movieID);
    		console.log("1111111111111");
    		document.getElementById("invisibleReadMore").style.display = "none";
    		focusController.disable('readMore');
    	}
    	$scope.lastMovie = $scope.currentMovie;
    	$scope.currentMovie = movieID;
        //if movieID provided
        if (movieID !== undefined) {
            //save current movie ID
            $scope.currentMovieID = movieID;
        }
        //returned from trailer using back button
        else {
            //stop trailer if player is started
            if ($scope.trailerPlayer !== undefined) {
                $scope.trailerPlayer.stopVideo();
            }
        }
        console.log("in launchMovieScreen1, movieID is: " + $scope.currentMovieID + "$scope.searchID is: " + $scope.searchID);
        console.log("movieID: " + movieID);
        $scope.recommendedMovies = [];
        // use movieID to update $scope.currentMovieInfo from TMDB
        $http.get("http://api.themoviedb.org/3/movie/" + $scope.currentMovieID + "?api_key=e88aa9ee18d8bb7b8395fd9fcc33cb39&language=he-IL&append_to_response=trailers,credits,recommendations").then(function(response) {
            var temp = response.data;
            var backdrop_path = temp.backdrop_path;
            var poster_path = temp.poster_path;
			//error check - check if images exist
			var backdropURL = null; //"http://wonkville.net/wp-content/uploads/2016/04/No-image-available.jpg";
			var posterURL = null; //"http://wonkville.net/wp-content/uploads/2016/04/No-image-available.jpg";
			if (temp.backdrop_path !== null) {
				backdropURL = "https://image.tmdb.org/t/p/w300" + backdrop_path;
			}
			if (temp.poster_path !== null) {
				posterURL = "https://image.tmdb.org/t/p/w342" + poster_path;
			}	
            //temp.backdrop_path = "https://image.tmdb.org/t/p/w300" + backdrop_path;
            //temp.poster_path = "https://image.tmdb.org/t/p/w342" + poster_path;
			temp.backdrop_path = backdropURL;
            temp.poster_path = posterURL;
            //handle null poster_path
			if (poster_path !== null) {
				jQuery('#moviePoster').css({
					'display': 'initial'
				});
			}
            if (poster_path === null) {
                jQuery('#moviePoster').css({
                    'display': 'none'
                });
            }
			
            $scope.currentMovieInfo = temp;
			//handle null genre
			if ($scope.currentMovieInfo.genres.length == 0){
				console.log("$scope.currentMovieInfo.genres.length:"+$scope.currentMovieInfo.genres.length);
				$scope.currentMovieInfo.genres[0] = {name: ""};
			}
			
            $scope.directorsName = [];
            //find the director(s):
            $scope.director = [];
            var crew = temp.credits.crew;
            for (var i = 0; i < crew.length; i++) {
                if (crew[i].job === 'Director' || crew[i].job === 'director') {
                    $scope.director.push(crew[i]);
                    $scope.directorsName.push(crew[i].name);
                    //break;
                }
            }
            var castNoDups = []; // no director-actor duplicates
            for (i = 0; i < temp.credits.cast.length; i++) {
                castNoDups.push(temp.credits.cast[i]);
                for (var j = 0; j < $scope.director.length; j++) {
                    if ($scope.director[j].id === temp.credits.cast[i].id) {
                        castNoDups.pop();
                        break;
                    }
                }
            }
            $scope.castList = $scope.director.concat(castNoDups);
            var releaseDate = new Date(temp.release_date);
            $scope.year = releaseDate.getFullYear();
            /* prepare list of recommended movies */
            temp = [];
            var recommendedResults = $scope.currentMovieInfo.recommendations.results;
            for (i = 0; i < recommendedResults.length; i++) {
                releaseDate = new Date(recommendedResults[i].release_date);
                var year = releaseDate.getFullYear();
                if (recommendedResults[i].poster_path === null) {
                    /// change place holder
                    temp.push({
                        "text": recommendedResults[i].title,
                        "image": "images/placeholder.svg",
                        "year": year,
                        "id": recommendedResults[i].id
                    });
                } else {
                    temp.push({
                        "text": recommendedResults[i].title,
                        "image": "https://image.tmdb.org/t/p/w342" + recommendedResults[i].poster_path,
                        "year": year,
                        "id": recommendedResults[i].id
                    });
                }
            }
            $scope.recommendedMovies = temp;
			document.getElementById("ratingLight").style.width = (215 * ($scope.currentMovieInfo.vote_average / 10)) + "px";
				
	        focusController.setDepth($scope.DEPTH.MOVIE_INFO);
	        $scope.currentDepth = $scope.DEPTH.MOVIE_INFO;
			changeDepth($scope.DEPTH.MOVIE_INFO);
			
	        focusController.disable('backFromMovieScreen');
	        focusController.focus('playTrailer');
	        jQuery('#backFromMovieScreen').css({
	            'display': 'none'
	        });
	        $scope.movieScreenReady = true;
	        $scope.showSpinner = false;
        });
        console.log(document.getElementById("overview"));
    };
    /*****************************************************************************
     * Launch index page of the application
     * When index screen is shown, it is possible to view list of the movies
     * Various of sorting and filtering options can be applied to this list
     ****************************************************************************/
    $scope.launchIndex = function() {
        $scope.currentDepth = $scope.DEPTH.INDEX;
        changeDepth($scope.DEPTH.INDEX);
        $scope.cancelBlurList();
        //reset list of cast
        $scope.castList = [];
        //reset last actor ID
        $scope.currentActorID = 0;
        //reset search error message
        $scope.errorMessage = "";
        //close additional menus
        $scope.closeFloatingMenu();
        //init search string
        $scope.search.string = "...חיפוש לפי שם הסרט";
        //stop trailer if player is started
        if ($scope.trailerPlayer !== undefined) {
            $scope.trailerPlayer.stopVideo();
        }
        //reset current currentMovieID
        if ($scope.currentMovieID !== undefined) {
            $scope.currentMovieID = undefined;
        }
		console.log("focusController.focus('searchCircle'): " + focusController.focus('searchCircle'));
		focusController.focus('searchCircle');
        //reset error message
        $scope.errorMessage = $scope.ERROR.UNKNOWN_ERROR;
        
        
    };
    /*****************************************************************************
     * Change read more of movie info icon on focus
     ****************************************************************************/
    $scope.focusReadMore = function() {
        jQuery('#overview span').css({
            "color": "#00c9ff",
            "text-shadow": "0 0 12px #00c9ff"
        });
    };
    /*****************************************************************************
     * Change read more of movie info icon on blur
     ****************************************************************************/
    $scope.blurReadMore = function() {
        jQuery('#overview span').css({
            "color": "#ffffff",
            "text-shadow": "none"
        });
    };
    /*****************************************************************************
     * Change read more of movie info icon on select
     ****************************************************************************/
    $scope.selectReadMore = function() {
        console.log($scope.currentMovieInfo.overview);
        jQuery('#movieForeground').css({
            "-webkit-filter": "blur(15px)",
            "background-color": "rgba(22, 22, 22, 0.5)"
        });
        jQuery('#castArea').css({
            "-webkit-filter": "blur(15px)",
            "background-color": "rgba(22, 22, 22, 0.5)"
        });
        $scope.currentDepth = $scope.DEPTH.PLOT_SCREEN;
        changeDepth($scope.DEPTH.PLOT_SCREEN);
        console.log("depth: " + $scope.currentDepth);
    };
    /*****************************************************************************
     * Change read more of bio icon on focus
     ****************************************************************************/
    $scope.focusReadMore2 = function() {
        jQuery('#actorBio span').css({
            "color": "#00c9ff",
            "text-shadow": "0 0 12px #00c9ff"
        });
    };
    /*****************************************************************************
     * Change read more of bio icon on blur
     ****************************************************************************/
    $scope.blurReadMore2 = function() {
        jQuery('#actorBio span').css({
            "color": "#ffffff",
            "text-shadow": "none"
        });
    };
    /*****************************************************************************
     * When recommended movies icon is selected
	 * Show apropriate screen
     ****************************************************************************/
    $scope.selectRecommendedMovies = function() {
        focusController.enable('invisibleButton');
        focusController.focus("invisibleButton");
        console.log($scope.currentMovieInfo.overview);
        jQuery('#movieForeground').css({
            "-webkit-filter": "blur(15px)",
            "background-color": "rgba(22, 22, 22, 0.5)"
        });
        jQuery('#castArea').css({
            "-webkit-filter": "blur(15px)",
            "background-color": "rgba(22, 22, 22, 0.5)"
        });
        $scope.currentDepth = $scope.DEPTH.RECOMMENDED_MOVIES;
        changeDepth($scope.DEPTH.RECOMMENDED_MOVIES);
        console.log("depth: " + $scope.currentDepth);
        focusController.enable('invisibleButton');
        focusController.focus("invisibleButton");
        console.log("123123");
        focusController.focus("exitRecommendedMovies");
        console.log("44444444444444");
    };
    /*****************************************************************************
     * Exit recommended movies screen
     ****************************************************************************/
    $scope.exitRecommendedMovies = function() {
        $scope.backToMovieScreen();
        jQuery('#castArea').css({
            "-webkit-filter": "none",
            "background-color": "none"
        });
    };
    /*****************************************************************************
     * Return to movie screen
     ****************************************************************************/
    $scope.backToMovieScreen = function() {
        $scope.currentActorID = 0;
        $scope.currentDepth = $scope.DEPTH.MOVIE_INFO;
        changeDepth($scope.DEPTH.MOVIE_INFO);
        jQuery('#movieForeground').css({
            "-webkit-filter": "none",
            "background-color": "none"
        });
        jQuery('#castArea').css({
            "-webkit-filter": "none",
            "background-color": "none"
        });
        focusController.disable('backFromMovieScreen');
        focusController.enable('homeFromMovieScreen');
        focusController.enable('readMore');
        focusController.enable('playTrailer');
        focusController.enable('reviews');
        focusController.enable('screeningHours');
        focusController.focus('playTrailer');
    };
    /*****************************************************************************
     * Launch actor information screen
     ****************************************************************************/
    $scope.launchActorScreen = function(index) {
    	document.getElementById("invisibleReadMore2").style.display = "none";
        $scope.lastActorIndex = index;
        console.log("actor index: " + index);
        jQuery('#movieForeground').css({
            "-webkit-filter": "blur(15px)",
            "background-color": "rgba(22, 22, 22, 0.5)"
        });
        $scope.actor = $scope.castList[index];
        console.log("actor name: " + $scope.actor.name);
        var actorID = $scope.actor.id;
        if (actorID != $scope.currentActorID){
			document.getElementById("actorBio").setAttribute("data-overflowed","false");
        }
        console.log("actor id: " + $scope.actor.id);
        /*  */
        $http.get("http://api.themoviedb.org/3/person/" + actorID + "?api_key=e88aa9ee18d8bb7b8395fd9fcc33cb39").then(function(response) {
            $scope.actorInfo = response.data;
            if (!response.data.biography) {
                $scope.actorInfo.biography = "No available biography";
            }
            //console.log("actorID: " + actorID + ", lastActorID: " + $scope.lastActorID);
            if (actorID !== $scope.currentActorID) { //then update actor profile image
            	$scope.currentDepth = $scope.DEPTH.ACTOR_INFO;
                //console.log('html: ' + jQuery('#overview').html());
                $scope.currentDepth = $scope.DEPTH.ACTOR_INFO;

                $scope.actorInfo.currentImage = "images/spinner.gif";
                $http.get("http://api.themoviedb.org/3/person/" + actorID + "/images?api_key=e88aa9ee18d8bb7b8395fd9fcc33cb39").then(function(response2) {
                    $scope.actorImages = response2.data.profiles;
                    //console.log("profiles length: " + $scope.actorImages.length);
                    if ($scope.actorImages.length === 0) {
                        $scope.actorInfo.currentImage = null;
                        document.getElementById("actorProfile").style.display = "none";
                    } else {
                        $scope.actorInfo.currentImage = "http://image.tmdb.org/t/p/h632" + response2.data.profiles[0].file_path ;
                        document.getElementById("actorProfile").style.display = "initial";
                    }
                    console.log("currentImage: " + $scope.actorInfo.currentImage);
                });
                $scope.currentActorID = actorID;
            }
        });
        focusController.disable('backFromMovieScreen');
        focusController.disable('homeFromMovieScreen');
        focusController.disable('readMore');
        focusController.disable('playTrailer');
        focusController.disable('reviews');
        focusController.disable('screeningHours');
        focusController.disable('backFromMovieScreen');
        focusController.enable('backFromActorScreen');
    };
    
    $scope.foo = function(){
    	console.log("foooooooooooooo!");
    };
    
    /*****************************************************************************
     * Return to movie screen from actor screen
     ****************************************************************************/
    $scope.homeFromActorScreen = function() {
        jQuery('#movieForeground').css({
            "-webkit-filter": "none",
            "background-color": "none"
        });
        focusController.enable('readMore');
        focusController.enable('playTrailer');
        focusController.enable('reviews');
        focusController.enable('screeningHours');
        focusController.enable('backFromMovieScreen');
        jQuery('#backFromMovieScreen').css({
            'display': 'initial'
        });
        focusController.enable('homeFromMovieScreen');
        $scope.launchIndex();
    };
    /*****************************************************************************
     * Show full actor biography
     ****************************************************************************/
    $scope.selectReadMoreActorBio = function() {
        jQuery('#actorScreen').css({
            "-webkit-filter": "blur(15px)",
            "background-color": "rgba(22, 22, 22, 0.5)"
        });
        jQuery('#castArea').css({
            "-webkit-filter": "blur(15px)",
            "background-color": "rgba(22, 22, 22, 0.5)"
        });
        jQuery('.capsule-button2').css({
            "display": "none"
        });
        jQuery('#bioLeftArrow').css({
            'display': 'none'
        });
        jQuery('#bioRightArrow').css({
            'display': 'initial'
        });
        $scope.currentDepth = $scope.DEPTH.ACTOR_BIO;
        $scope.bioPage = $scope.actorInfo.biography;
        $scope.lastPageOffset = 0; //bio pages
        $scope.offsetArray = [0];
        $scope.fullBioRightArrow = "images/full-bio-right-arrow.svg";
        $scope.fullBioLeftArrow = "images/full-bio-left-arrow.svg";
        console.log("depth: " + $scope.currentDepth);
        focusController.enable('backFromBioButton');
        focusController.disable('focus2');
        focusController.disable('invisibleReadMore2');
        focusController.disable('backFromActorScreen');
        focusController.focus('backFromBioButton');
        $scope.updateBioArrows();
    };
    /*****************************************************************************
     * Change right arrow of bio on focus
     ****************************************************************************/
    $scope.focusFullBioRightArrow = function() {
        $scope.fullBioRightArrow = "images/full-bio-right-arrow-focused.svg";
    };
    /*****************************************************************************
     * Change right arrow of bio on blur
     ****************************************************************************/
    $scope.blurFullBioRightArrow = function() {
        $scope.fullBioRightArrow = "images/full-bio-right-arrow.svg";
    };
    /*****************************************************************************
     * Change left arrow of bio on focus
     ****************************************************************************/
    $scope.focusFullBioLeftArrow = function() {
        $scope.fullBioLeftArrow = "images/full-bio-left-arrow-focused.svg";
    };
    /*****************************************************************************
     * Change left arrow of bio on blur
     ****************************************************************************/
    $scope.blurFullBioLeftArrow = function() {
        $scope.fullBioLeftArrow = "images/full-bio-left-arrow.svg";
    };
    /*****************************************************************************
     * Return to actor screen
     ****************************************************************************/
    $scope.backToActorScreen = function() {
        $scope.currentDepth = $scope.DEPTH.ACTOR_INFO;
        jQuery('#actorScreen').css({
            "-webkit-filter": "none",
            "background-color": "none"
        });
        jQuery('#castArea').css({
            "-webkit-filter": "none",
            "background-color": "none"
        });
        jQuery('.capsule-button2').css({
            "display": "initial"
        });
        focusController.enable('focus2');
        focusController.enable('invisibleReadMore2');
        focusController.enable('backFromActorScreen');
        focusController.enable('homeFromActorScreen');
        focusController.disable('backFromBioButton');
        focusController.focus('invisibleReadMore2');
    };
    /*****************************************************************************
     * Change current focusable depth accordingly to active page
     ****************************************************************************/
    var changeDepth = function(depth) {
        var lastDepth;
        $scope.currentDepth = depth;
        $timeout(function() {
            focusController.setDepth(depth);
        }, 1);
        console.log("from cahgeDepth func, getCurrentDepth(): " + focusController.getCurrentDepth());
    };
    /*****************************************************************************
     * Change visibility of the bio arrows
     ****************************************************************************/
    $scope.updateBioArrows = function() {
        $timeout(function() {
            var of = document.getElementById("bio").getAttribute("data-overflowed");
            if (of === 'true') {
                document.getElementById("bioRightArrow").style.display = "initial";
            } else {
                document.getElementById("bioRightArrow").style.display = "none";
                focusController.focus('backFromBioButton');
            }
            console.log("of: " + of);
        }, 50);
        var offset = $scope.offsetArray[$scope.offsetArray.length - 1];
        if (offset === 0) {
            jQuery('#bioLeftArrow').css({
                "display": "none"
            });
            focusController.focus('backFromBioButton');
        } else {
            jQuery('#bioLeftArrow').css({
                "display": "initial"
            });
        }
        console.log("offset: " + offset);
    };
    /*****************************************************************************
     * Get next page of bio
     ****************************************************************************/
    $scope.nextPage = function() {
            var fullText = $scope.actorInfo.biography;
            var currPage = jQuery('#bio').text();
            //$scope.lastPageLength = truncatedText.length;
            //lastOffset = $scope.lastPageOffset;
            var lastOffset = $scope.offsetArray[$scope.offsetArray.length - 1];
            var nextChunk = fullText.slice(currPage.length + lastOffset);
            console.log("nextChunk: " + nextChunk);
            $scope.bioPage = nextChunk;
            //$scope.lastPageOffset += truncatedText.length;
            $scope.offsetArray.push(lastOffset + currPage.length);
            $scope.updateBioArrows();
            //console.log("$scope.lastPageOffset: "+$scope.lastPageOffset);
        };
    /*****************************************************************************
     * Get previous page of bio
     ****************************************************************************/
    $scope.prevPage = function() {
        var fullText = $scope.actorInfo.biography;
        $scope.offsetArray.pop();
        var offset = $scope.offsetArray[$scope.offsetArray.length - 1];
        //offset = $scope.lastPageOffset - $scope.lastPageLength;
        var nextChunk = fullText.slice(offset);
        //$scope.lastPageOffset = offset;
        $scope.bioPage = nextChunk;
        console.log("$scope.lastPageOffset: " + $scope.lastPageOffset);
        //console.log("nextChunk: "+nextChunk);
        $scope.updateBioArrows();
    };
    /*****************************************************************************
     * Launch screen with movies of current actor
     ****************************************************************************/
    $scope.launchActorsMoviesScreen = function() {
        //jQuery('#actorsMoviesList').eq(0).trigger('resize');
        focusController.enable('invisibleButton');
        focusController.focus("invisibleButton");
        $scope.actorsMovies = [];
        //jQuery('#actorsMoviesList').eq(0).trigger('reload');
        jQuery('#actorScreen').css({
            "-webkit-filter": "blur(15px)",
            "background-color": "rgba(22, 22, 22, 0.5)"
        });
        jQuery('#castArea').css({
            "-webkit-filter": "blur(15px)",
            "background-color": "rgba(22, 22, 22, 0.5)"
        });
        jQuery('.capsule-button2').css({
            "display": "none"
        });
        jQuery('#bioLeftArrow').css({
            'display': 'none'
        });
        jQuery('#bioRightArrow').css({
            'display': 'initial'
        });
        focusController.disable('focus2');
        focusController.disable('invisibleReadMore2');
        focusController.disable('backFromActorScreen');
        focusController.disable('homeFromActorScreen');
        $scope.currentDepth = $scope.DEPTH.ACTOR_MOVIES;

        $http.get("http://api.themoviedb.org/3/discover/movie?with_people=" + $scope.actor.id + "&sort_by=popularity.desc&api_key=e88aa9ee18d8bb7b8395fd9fcc33cb39&language=he-IL&page=1"+ $scope.voteCount).then(function(response) {
            $scope.myData2 = response.data.results;
            $scope.lastRetrievedPage2 = 1;
            $scope.totalPages2 = response.data.total_pages;
            var temp = [];
            for (var i = 0; i < $scope.myData2.length; i++) {
                var releaseDate = new Date(response.data.results[i].release_date);
                var year = releaseDate.getFullYear();
                if (response.data.results[i].poster_path === null) {
                    /// change place holder
                    temp.push({
                        "text": response.data.results[i].title,
                        "image": "images/placeholder.svg",
                        "year": year,
                        "id": response.data.results[i].id
                    });
                } else {
                    temp.push({
                        "text": response.data.results[i].title,
                        "image": "https://image.tmdb.org/t/p/w342" + response.data.results[i].poster_path,
                        "year": year,
                        "id": response.data.results[i].id
                    });
                }
            }
            $scope.actorsMovies = temp;
            jQuery('#actorsMoviesList').trigger('reload');
            //console.log("$scope.actorsMovies: "+$scope.actorsMovies[0].id);
        });
    };
    /*****************************************************************************
     * Change invisible button on blur
     ****************************************************************************/
    $scope.blurInvisibleButton = function() {
        focusController.disable('invisibleButton');

    };
    /*****************************************************************************
     * Return to actor screen from screen of movies of current actor
     ****************************************************************************/
    $scope.backFromActorsMovies = function() {
        $scope.actorsMovies = [];
        //jQuery('#actorsMoviesList').eq(0).trigger('resize');
        $scope.backToActorScreen();
        //jQuery('#actorsMoviesList').trigger('reload');

    };
    /*****************************************************************************
     * Return to home from screen of movies of current actor
     ****************************************************************************/
    $scope.homeFromActorsMovies = function() {
        $scope.actorsMovies = [];
        //jQuery('#actorsMoviesList').eq(0).trigger('resize');
        $scope.backToActorScreen();
        $scope.homeFromActorScreen();
        //jQuery('#actorsMoviesList').trigger('reload');

    };
    /***************************************************************************** 
     * Request next page of movies from the content server
     * For screen of movies of current actor
     ****************************************************************************/
    $scope.getNextPage2 = function() { // for actor's movies screen
        if ($scope.lastRetrievedPage2 < $scope.totalPages2) {
            $http.get("http://api.themoviedb.org/3/discover/movie?with_people=" + $scope.actor.id + "&sort_by=popularity.desc&api_key=e88aa9ee18d8bb7b8395fd9fcc33cb39&language=he-IL"+ $scope.voteCount +"&page=" + (1 + $scope.lastRetrievedPage2)).then(function(response) {
                $scope.myData2 = response.data.results;
                $scope.lastRetrievedPage2++;
                var temp = [];
                for (var i = 0; i < $scope.myData2.length; i++) {
                    var releaseDate = new Date(response.data.results[i].release_date);
                    var year = releaseDate.getFullYear();
                    if (response.data.results[i].poster_path === null) {
                        /// change place holder
                        temp.push({
                            "text": response.data.results[i].title,
                            "image": "images/placeholder.svg",
                            "year": year,
                            "id": response.data.results[i].id
                        });
                    } else {
                        temp.push({
                            "text": response.data.results[i].title,
                            "image": "https://image.tmdb.org/t/p/w342" + response.data.results[i].poster_path,
                            "year": year,
                            "id": response.data.results[i].id
                        });
                    }
                }
                $scope.actorsMovies = $scope.actorsMovies.concat(temp);
            });
        }
    };
    /***************************************************************************** 
     * Launch movie screen from screen of movies of current actor
     ****************************************************************************/
    $scope.launchMovieScreenFromActorsMovies = function(id) {
        $scope.castList = [];
        $scope.actorsMovies = [];
        $scope.launchMovieScreen(id);
        $scope.backToActorScreen();
        $scope.backToMovieScreen();
    };
    /***************************************************************************** 
     * Launch movies screen from screen of recomended movies
     ****************************************************************************/
    $scope.launchMovieScreenFromRecommendedMovies = function(id) {
        //focusController.focus('exitRecommendedMovies');
        //console.log("did it");
        $scope.launchMovieScreenFromActorsMovies(id);
   };
   /** CREATE BACKGROUND FROM MOVIE LIST **/
   /*****************************************************************************
    * Blur movie list when it used as a background
    ****************************************************************************/
    $scope.blurList = function() {
        if ($scope.current_depth === $scope.DEPTH.INDEX) {
            angular.element('#movieListContainer').css('filter', 'blur(0px)');
            angular.element('#movieListContainer').css('-webkit-filter', 'blur(0px)');
        } else {
            angular.element('#movieListContainer').css('filter', 'blur(40px)');
            angular.element('#movieListContainer').css('-webkit-filter', 'blur(40px)');
        }
    };
    /*****************************************************************************
     * Blur movie list when it used as a foreground
     ****************************************************************************/
    $scope.cancelBlurList = function() {
        angular.element('#movieListContainer').css('filter', 'blur(0px)');
        angular.element('#movieListContainer').css('-webkit-filter', 'blur(0px)');
    };

    /** UPDATE MOVIE LIST FROM API SERVER **/
    /***************************************************************************** 
     * Request first page of movies from the content server
     * Select filtered and sorted data from the collection of all movies
     * The result is filtered and sorted accordingly to selected options
     ****************************************************************************/
    $scope.updateDataFromDB = function() {
        console.log("in updateDataFromDB");
        var request = "http://api.themoviedb.org/3/discover/movie?sort_by=" + $scope.sortingCriteria + "&api_key=e88aa9ee18d8bb7b8395fd9fcc33cb39" + $scope.filteringGenre + $scope.voteCount + "&language=he-IL&page=1";
        if ($scope.filteringCriteria !== "") {
            request = "http://api.themoviedb.org/3/movie" + $scope.filteringCriteria + "?api_key=e88aa9ee18d8bb7b8395fd9fcc33cb39&sort_by=" + $scope.sortingCriteria + $scope.voteCount +  "&language=he-IL&page=1";
        }
        console.log("request: "+request);
        $scope.movies = [];
        $http.get(request).then(function(response) {
            //$http.get("http://api.themoviedb.org/3/movie/top_rated?api_key=e88aa9ee18d8bb7b8395fd9fcc33cb39").then(function (response) {
            $scope.myData = response.data.results;
            $scope.lastRetrievedPage = 1;
            $scope.totalPages = response.data.total_pages;
            var temp = [];
            console.log("getting all movies");
            console.log($scope.myData);
            if ($scope.myData !== undefined) {
                for (var i = 0; i < $scope.myData.length; i++) {
                    var releaseDate = new Date(response.data.results[i].release_date);
                    var year = releaseDate.getFullYear();
                    //error check - check if images exist
                    var imgURL = "images/placeholder.svg";
                    if (response.data.results[i].poster_path !== null) {
                        imgURL = "https://image.tmdb.org/t/p/w342" + response.data.results[i].poster_path;
                    }
                    temp.push({
                        "text": response.data.results[i].title,
                        //error check
                        "image": imgURL,
                        "year": year,
                        "id": response.data.results[i].id
                    });
                }
            }
            //add new movies to $scope.movies
            $scope.movies = temp;
            console.log("entries_received is: " + temp.length);
            jQuery('#movieList').trigger('reload');
            console.log("testing");
        });
    };


    /*---------------------------------TRAILER----------------------------------*/
    /***************************************************************************** 
     * Get Youtube ID of the current movie's trailer
     ****************************************************************************/
    $scope.getTrailerURL = function() {
        //if no movieID availiable - exit
        if ($scope.currentMovieID === undefined) {
            return;
        }
        console.log("in getTrailerURL");
        //request for youtube trailer id
        var request = "https://api.themoviedb.org/3/movie/" + $scope.currentMovieID + "/videos?api_key=e88aa9ee18d8bb7b8395fd9fcc33cb39";
        $http.get(request).then(function(response) {
            //check if any trailer exists
            if (response.data.results[0] === undefined) {
                console.log("response.data.results[0] === undefined");
                //no trailer will be displayed
                console.log("$scope.trailerID is: " + $scope.trailerID);
                $scope.trailerID = undefined;
                console.log("$scope.trailerID is: " + $scope.trailerID);
                //show trailer not found screen
                changeDepth($scope.DEPTH.ERROR);
                $scope.errorMessage = $scope.ERROR.TRAILER;
                console.log("Error message is: " + $scope.errorMessage);
                return;
            } else {
                console.log("response.data.results[0] !== undefined");
                //get youtube trailer ID
                $scope.trailerID = response.data.results[0].key;
                console.log("$scope.trailerID is: " + $scope.trailerID);
                //(re)start trailer if player is started
                if ($scope.trailerPlayer !== undefined) {
                    console.log("restarting trailer");
                    $scope.trailerPlayer.playVideo();
                }
            }
        });
        //$scope.currentMovieID = undefined;
    };
	
    $scope.$on('youtube.player.playing', function ($event, player) {
    	console.log("youtube.player.playing");
    	$scope.showControlsThenHide();
    	$scope.isTrailerPlaying = true;
        $scope.disableScreenSaver();
        $scope.progressbar.start();  
        //focusController.focus('backFromTrailerScreen');
        //$scope.progressbar.complete();
        progress = $interval(function(){
        	var currentProgress = 100.0*(player.getCurrentTime() / player.getDuration());
        	$scope.progressbar.set(currentProgress);
        	if (currentProgress == 100){
            	$scope.progressbar.reset();	
            	console.log("reset progressbar");
        	}
        },10);
    });
	
    $scope.$on('youtube.player.ended', function ($event, player) {
    	$scope.exitTrailerScreen();
    });
	
    $scope.$on('youtube.player.error', function($event, player){
    	//$scope.exitTrailerScreen();
        changeDepth($scope.DEPTH.ERROR);
        $scope.errorMessage = $scope.ERROR.TRAILER;
    });
    
    $scope.backFromTrailerScreen = function(){
    	if (!$scope.showControls){ //then show the controls and return (user didn't see what he was pressing - maybe doesn't want to exit)
    		$scope.showControlsThenHide();
    		return;
    	}else{ //the user can see the control so he really wants to exit
    		$scope.exitTrailerScreen();
    	}
    };
    
    $scope.exitTrailerScreen = function(){
    	$scope.isTrailerPlaying = false;
    	$scope.tailerScreenReady = false;
    	$scope.enableScreenSaver();
    	$interval.cancel(progress);
    	$scope.trailerPlayer.stopVideo();
    	$scope.progressbar.reset();
    	console.log("$scope.progressbar.status(): " + $scope.progressbar.status());
    	$scope.launchMovieScreen(undefined);
    };
	
    $scope.disableScreenSaver = function(){
    	console.log("disabling screen saver");
        if ($scope.isTizen) {
        	webapis.appcommon.setScreenSaver(webapis.appcommon.AppCommonScreenSaverState.SCREEN_SAVER_OFF);
        }	
    };
	
    $scope.enableScreenSaver = function(){
    	console.log("enabling screen saver");
    	if ($scope.isTizen) {
        	webapis.appcommon.setScreenSaver(webapis.appcommon.AppCommonScreenSaverState.SCREEN_SAVER_ON);
    	}
    };
	
	$scope.showControlsThenHide = function(){
		$timeout.cancel(showHideTimer);	/** cancel previous timer **/
		$scope.showControls = true;
		showHideTimer = $timeout(function(){
			$scope.showControls = false;
		}, 10000); //can be adjusted
	};
	
	/** play/pause button functionality **/
	$scope.focusPlayPauseButton = function(){
		$scope.showControlsThenHide();
		if ($scope.trailerPlayer.getPlayerState() == 1){ // if video is currently playing
			$scope.playPauseButton = "images/pause-selected-player.svg";
		}
		else if ($scope.trailerPlayer.getPlayerState() == 2){ //if video is currently paused
			$scope.playPauseButton = "images/play-selected-player.svg";
		}
	};
	
	$scope.blurPlayPauseButton = function(){
		$scope.showControlsThenHide();	
		if ($scope.trailerPlayer.getPlayerState() == 1){ // if video is currently playing
			$scope.playPauseButton = "images/pause-regular-player.svg";
		}
		else if ($scope.trailerPlayer.getPlayerState() == 2){ //if video is currently paused
			$scope.playPauseButton = "images/play-regular-player.svg";
		}		
	};
	
	$scope.selectPlayPauseButton = function(){
    	if (!$scope.showControls){ //then show the controls and return
    		$scope.showControlsThenHide();
    		return;
    	}
		$scope.showControlsThenHide();
		var initialContainerHtml = document.getElementById("play-container").innerHTML; //this var needs to change!

		if ($scope.trailerPlayer.getPlayerState() == 1){ // if video is currently playing
			//switch it to the focused play button
			$scope.playPauseButton = "images/play-selected-player.svg";
            //pause the video
			$scope.trailerPlayer.pauseVideo();
		}
		else if ($scope.trailerPlayer.getPlayerState() == 2){ //if video is currently paused
			//switch it to the focused pause button
			$scope.playPauseButton = "images/pause-selected-player.svg";
			//play video
            $scope.trailerPlayer.playVideo();
		}
	};
	
	/** >> button functionality **/
	$scope.focusFfButton = function(){
		$scope.showControlsThenHide();
		$scope.ffButton = 'images/forward-selected-player.svg';
	};
	
	$scope.blurFfButton = function(){
		$scope.showControlsThenHide();
		$scope.ffButton = 'images/forward-regular-player.svg';
	};
	
	$scope.selectFfButton = function(){
		$scope.showControlsThenHide();
		var currentTime = $scope.trailerPlayer.getCurrentTime();
		$scope.trailerPlayer.seekTo(currentTime+10, true);
	};
	
	/** << button functionality **/
	$scope.focusBbButton = function(){
		$scope.showControlsThenHide();
		$scope.bbButton = 'images/backward-selected-player.svg';
	};
	
	$scope.blurBbButton = function(){
		$scope.showControlsThenHide();
		$scope.bbButton = 'images/backward-regular-player.svg';
	};
	
	$scope.selectBbButton = function(){
    	if (!$scope.showControls){ //then show the controls and return
    		$scope.showControlsThenHide();
    		return;
    	}
		$scope.showControlsThenHide();
		var currentTime = $scope.trailerPlayer.getCurrentTime();
		$scope.trailerPlayer.seekTo(currentTime-10, true);
	};
	
    $scope.$watch(function(scope){
    	return $scope.showControls;
    }, function(scope){
    	if($scope.showControls){
			jQuery('#playbackButtonsContainer').css({
				'background-color':  'rgba(22, 22, 22, 0.4)'
			});			
    	}else{
			jQuery('#playbackButtonsContainer').css({
				'background-color':  'rgba(22, 22, 22, 0)'
			});	
    	}
    });
	
    /***************************************************************************** 
     * Launch TRAILER screen when show trailer button is selected
     ****************************************************************************/
    $scope.launchTrailerScreen = function() {
    	$scope.playPauseButton = "images/pause-regular-player.svg";
        console.log("in launchTrailerScreen()");
        //change depth
        focusController.setDepth($scope.DEPTH.TRAILER);
        changeDepth($scope.DEPTH.TRAILER);
        //blur background
        $scope.blurList();
        //get trailer URL
        $scope.getTrailerURL();
    };

	
    /*---------------------------------SORTING----------------------------------*/
    /***************************************************************************** 
     * Launch SORT screen when filter button is selected
     ****************************************************************************/
    $scope.launchSortScreen = function() {
        //change depth
        focusController.setDepth($scope.DEPTH.SORT);
        changeDepth($scope.DEPTH.SORT);
        //blur background
        $scope.blurList();
    };
    /***************************************************************************** 
     * Apply various sorting options to the movie list
     * Update current movie list accordingly to selected options
     ****************************************************************************/
    $scope.sortBy = function(attribute) {
    	focusController.setDepth($scope.DEPTH.INDEX);
        console.log("in sortBy, chosen option is: " + attribute);
        console.log($scope.sortingCriteria);
        switch (attribute) {
            //sort by release date ascending
            case 1:
                if ($scope.sortingCriteria !== $scope.SORTING.DATEASC) {
                    console.log("getting new data SORTING.DATEASC");
                    $scope.sortingCriteria = $scope.SORTING.DATEASC;
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB($scope.SORTING.DATEASC);
                    $scope.sortValue = "תאריך בסדר עולה";
                }
                break;
            //sort by release date descending
            case 2:
                if ($scope.sortingCriteria !== $scope.SORTING.DATEDESC) {
                    console.log("getting new data SORTING.DATEDESC");
                    $scope.sortingCriteria = $scope.SORTING.DATEDESC;
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB($scope.SORTING.DATEDESC);
                    $scope.sortValue = "סרטים חדשים";
                }
                break;
            //sort by popularity ascending
            case 3:
                if ($scope.sortingCriteria !== $scope.SORTING.POPASC) {
                    console.log("getting new data SORTING.POPASC");
                    $scope.sortingCriteria = $scope.SORTING.POPASC;
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB($scope.SORTING.POPASC);
                    $scope.sortValue = "פופולריות בסדר עולה";
                }
                break;
            //sort by popularity descending
            case 4:
                if ($scope.sortingCriteria !== $scope.SORTING.POPDESC) {
                    console.log("getting new data SORTING.POPDESC");
                    $scope.sortingCriteria = $scope.SORTING.POPDESC;
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB($scope.SORTING.POPDESC);
                    $scope.sortValue = "הנצפים ביותר";
                }
                //default sorting is by popularity descending
                //don't sort again but update the sortValue
                else {
                	$scope.sortValue = "הנצפים ביותר";
                }
                break;
            //sort by average votes ascending
            case 5:
                if ($scope.sortingCriteria !== $scope.SORTING.VOTEASC) {
                    console.log("getting new data SORTING.VOTEASC");
                    $scope.sortingCriteria = $scope.SORTING.VOTEASC;
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB($scope.SORTING.VOTEASC);
                    $scope.sortValue = "דירוג בסדר עולה";
                }
                break;
            //sort by average votes descending
            case 6:
                if ($scope.sortingCriteria !== $scope.SORTING.VOTEDESC) {
                    console.log("getting new data SORTING.VOTEDESC");
                    $scope.sortingCriteria = $scope.SORTING.VOTEDESC;
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB($scope.SORTING.VOTEDESC);
                    $scope.sortValue = "דירוג הצופים";
                }
                break;
            //sort by average votes ascending
            case 7:
                if ($scope.sortingCriteria !== $scope.SORTING.TITLEASC) {
                    console.log("getting new data SORTING.TITLEASC");
                    $scope.sortingCriteria = $scope.SORTING.TITLEASC;
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB($scope.SORTING.TITLEASC);
                    $scope.sortValue = "כותרת בסדר עולה";
                }
                break;
            //sort by average votes descending
            case 8:
                if ($scope.sortingCriteria !== $scope.SORTING.TITLEDESC) {
                    console.log("getting new data SORTING.TITLEDESC");
                    $scope.sortingCriteria = $scope.SORTING.TITLEDES;
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB($scope.SORTING.TITLEDES);
                    $scope.sortValue = "כותרת בסדר יורד";
                }
                break;


            default:
                break;
        }
		
        //return to index page
        $scope.launchIndex();
        console.log("out sortBy");
    };


    /*--------------------------------FILTERING---------------------------------*/
    /*****************************************************************************
     * Launch FILTER screen when filter button is selected
     ****************************************************************************/
    $scope.launchFilterScreen = function() {
        //change depth
        focusController.setDepth($scope.DEPTH.FILTER);
        $scope.currentDepth = $scope.DEPTH.FILTER;
        changeDepth($scope.DEPTH.FILTER);
        //blur background
        $scope.blurList();
    };
    /***************************************************************************** 
     * Update appropriate variable's values when FILTERING BY GENRE is selected
     ****************************************************************************/
    $scope.onGenreFocused = function() {
        //change show more arrow
        $scope.focusShowMore();
        $scope.filteringCriteria = "";
        $scope.isLanguageFocused = false;
        if (!$scope.isGenreFocused) {
            $scope.isGenreFocused = true;
        } else {
            //$scope.isGenreFocused = false;
        }
    };
    /***************************************************************************** 
     * Update appropriate variable's values when FILTERING BY LANGUAGE is selected
     ****************************************************************************/
    $scope.onLanguageFocused = function() {
        $scope.filteringCriteria = "";
        $scope.isGenreFocused = false;
        if (!$scope.isLanguageFocused) {
            $scope.isLanguageFocused = true;
        } else {
            //$scope.isLanguageFocused = false;
        }
    };
    /***************************************************************************** 
     * Close additional FILTER menu when no longer in use
     ****************************************************************************/
    $scope.closeFloatingMenu = function() {
        $scope.isGenreFocused = false;
        $scope.isLanguageFocused = false;
    };
    /***************************************************************************** 
     * Apply various filtering options to the movie list
     * Update current movie list accordingly to selected options
     ****************************************************************************/
    $scope.filterBy = function(attribute) {
    	focusController.setDepth($scope.DEPTH.INDEX);
        $scope.isAllMovieShown = false;
        console.log("in filterBy, chosen option is: " + attribute);
        console.log($scope.filteringGenre);
        switch (attribute) {
            /** NEW FILMS **/
            case 1:
                $scope.filteringGenre = $scope.filteringLanguage = "";
                if ($scope.filteringCriteria !== "/now_playing") {
                    console.log("getting new data /now_playing");
                    $scope.filteringCriteria = "/now_playing";
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB("/now_playing");
                    $scope.filterValue = "סרטים חדשים";
                    $scope.disableSort();                   
                }
                break;
            /** MOST VIEWED FILMS **/
            case 2:
                $scope.filteringGenre = $scope.filteringLanguage = "";
                if ($scope.filteringCriteria !== "/popular") {
                    console.log("getting new data /popular");
                    $scope.filteringCriteria = "/popular";
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB("/popular");
                    $scope.filterValue = "הנצפים ביותר";
                    $scope.disableSort();                }
                break;

            /** BY GENRES **/
            //Drama
            case 3:
                if ($scope.filteringGenre !== $scope.GENRE.DRAMA) {
                    console.log("getting new data GENRE.DRAMA");
                    $scope.filteringGenre = $scope.GENRE.DRAMA;
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB($scope.GENRE.DRAMA);
                    $scope.filterValue = "דרמה";
                    $scope.enableSort();
                }
                break;
            //Comedy
            case 4:
                if ($scope.filteringGenre !== $scope.GENRE.COMEDY) {
                    console.log("getting new data GENRE.COMEDY");
                    $scope.filteringGenre = $scope.GENRE.COMEDY;
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB($scope.GENRE.COMEDY);
                    $scope.filterValue = "קומדיה";
                    $scope.enableSort();                }
                break;
            //Thriller/Action
            case 5:
                if ($scope.filteringGenre !== "&with_genres=53|28") {
                    console.log("getting new data with_genres=53|28");
                    $scope.filteringGenre = "&with_genres=53|28";
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB("&with_genres=53|28");
                    $scope.filterValue = "מתח / פעולה";
                    $scope.enableSort();                }
                break;
            //Kids
            case 6:
                if ($scope.filteringGenre !== "&with_genres=10751") {
                    console.log("getting new data with_genres=10751");
                    $scope.filteringGenre = "&with_genres=10751";
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB("&with_genres=10751");
                    $scope.filterValue = "ילדים";
                    $scope.enableSort();                }
                break;
            //Horror
            case 7:
                if ($scope.filteringGenre !== "&with_genres=27") {
                    console.log("getting new data with_genres=27");
                    $scope.filteringGenre = "&with_genres=27";
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB("&with_genres=27");
                    $scope.filterValue = "אימה";
                    $scope.enableSort();                }
                break;
            //Animation
            case 8:
                if ($scope.filteringGenre !== "&with_genres=16") {
                    console.log("getting new data with_genres=16");
                    $scope.filteringGenre = "&with_genres=16";
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB("&with_genres=16");
                    $scope.filterValue = "אנימציה";
                    $scope.enableSort();                }
                break;
            //Documentary
            case 9:
                if ($scope.filteringGenre !== "&with_genres=99") {
                    console.log("getting new data with_genres=99");
                    $scope.filteringGenre = "&with_genres=99";
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB("&with_genres=99");
                    $scope.filterValue = "דוקומנטרי";
                    $scope.enableSort();                }
                break;
            //Adventure
            case 10:
                if ($scope.filteringGenre !== "&with_genres=12") {
                    console.log("getting new data with_genres=12");
                    $scope.filteringGenre = "&with_genres=12";
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB("&with_genres=12");
                    $scope.filterValue = "הרפתקה";
                    $scope.enableSort();                }
                break;
            //Science Fiction
            case 11:
                if ($scope.filteringGenre !== "&with_genres=878") {
                    console.log("getting new data with_genres=878");
                    $scope.filteringGenre = "&with_genres=878";
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB("&with_genres=878");
                    $scope.filterValue = "מדע בדיוני";
                    $scope.enableSort();                }
                break;
            //Crime
            case 12:
                if ($scope.filteringGenre !== "&with_genres=80") {
                    console.log("getting new data with_genres=80");
                    $scope.filteringGenre = "&with_genres=80";
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB("&with_genres=80");
                    $scope.filterValue = "פשע";
                    $scope.enableSort();                }
                break;

            /** SOON IN CINEMAS **/
            case 13:
                if ($scope.filteringCriteria !== "/upcoming") {
                    console.log("getting new data /upcoming");
                    $scope.filteringCriteria = "/upcoming";
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB("/upcoming");
                    $scope.filterValue = "בקרוב בבתי הקולנוע";
                }
                break;

            /** ALL MOVIES UNFILTERED **/
            case 14:
                if (!$scope.isAllMovieShown) {
                    console.log("getting new data ''");
                    $scope.filteringGenre = $scope.filteringLanguage = $scope.filteringCriteria = "";
                    $scope.lastRetrievedPage = 0;
                    $scope.updateDataFromDB("");
                    $scope.isAllMovieShown = true;
                    $scope.filterValue = "כל הסרטים";
                    $scope.enableSort();                }
                break;

            default:
                break;
        }
		
        //return to index page
        $scope.launchIndex();
        console.log("out filterBy");
    };
    
    $scope.disableSort = function(){
        focusController.disable('sortBy');
        jQuery('#sort').removeClass('dropdown');
        jQuery('#sort').addClass('dropdown-disabled');
        
        jQuery('#sort-dropdown-text').removeClass('dropdown-text');
        jQuery('#sort-dropdown-text').addClass('dropdown-text-disabled');

        jQuery('#sortArrow').css({
        	"display": "none"
        });
    };
    
    $scope.enableSort = function(){
    	focusController.enable('sortBy');
        jQuery('#sort').addClass('dropdown');
        jQuery('#sort').removeClass('dropdown-disabled');
        
        jQuery('#sort-dropdown-text').addClass('dropdown-text');
        jQuery('#sort-dropdown-text').removeClass('dropdown-text-disabled');

        jQuery('#sortArrow').css({
        	"display": "initial"
        });
    	
    };

    /*--------------------------------SEARCHING---------------------------------*/
    /***************************************************************************** 
     * Launch SEARCH screen when search button is selected
     ****************************************************************************/
    $scope.launchSearchScreen = function() {
        //change depth
        focusController.setDepth($scope.DEPTH.SEARCH);
        changeDepth($scope.DEPTH.SEARCH);
        //blur background
        $scope.blurList();
    };
    /***************************************************************************** 
     * Get movie ID from movie title provided by user
     ****************************************************************************/
    $scope.showMovieInfo = function(movieName) {
        console.log("in getMovieID movieName is: " + movieName);
        if (movieName !== "") {
            var request = "https://api.themoviedb.org/3/search/movie?api_key=e88aa9ee18d8bb7b8395fd9fcc33cb39&query=" + movieName;
            var movieID;
            $http.get(request).then(function(response) {
                //take ID of first returned result
                if (response.data.results[0] === undefined) {
                    //show movie not found screen
                    changeDepth($scope.DEPTH.ERROR);
                    $scope.errorMessage = $scope.ERROR.NO_MOVIES_FOUND;
                    console.log("Error message is: " + $scope.errorMessage);
                } else {
                    movieID = response.data.results[0].id;
                    console.log("internal movieID is: " + movieID);
                    $scope.searchID = movieID;
                    if (movieID !== undefined) {
                        //show movie info
                        $scope.launchMovieScreen(movieID);
                    }
                }
            });
        }
        //empty string entered
        else {
            //show movie not found screen
            changeDepth($scope.DEPTH.ERROR);
            $scope.errorMessage = $scope.ERROR.NO_STRING_ENTERED;
            console.log("Error message is: " + $scope.errorMessage);
        }
        $scope.searchID = undefined;
        console.log($scope.errorMessage);
        console.log("app movieID is: " + $scope.searchID);
    };
	/***************************************************************************** 
     * Get multiple results of a search based on search string provided by user
     ****************************************************************************/
    $scope.showSearchResults = function() {
		console.log("in showSearchResults()");
		console.log("current depth is: " + $scope.currentDepth);
		console.log("$scope.search.string is: " + $scope.search.string);
		$scope.searchResults = [];
        if ($scope.search.string !== "") {
            var request = "https://api.themoviedb.org/3/search/movie?api_key=e88aa9ee18d8bb7b8395fd9fcc33cb39&query=" + $scope.search.string + "&page=1";
            $http.get(request).then(function(response) {
				$scope.searchResults = response.data.results;
				$scope.lastRetrievedPageOfResults = 1;
				$scope.totalPagesOfResults = response.data.total_pages;	
				console.log("scope.searchResults[0] is " + $scope.searchResults[0]);			
                //if no results returned - show error message
                if ($scope.searchResults[0] === undefined) {
                    //show no approproate results found screen
                    changeDepth($scope.DEPTH.ERROR);
                    $scope.errorMessage = $scope.ERROR.NO_MOVIES_FOUND;
                    console.log("Error message is: " + $scope.errorMessage);
					return;
                } 
				else {
					var temp = [];
					for (var i = 0; i < $scope.searchResults.length; i++) {
						var releaseDate = new Date(response.data.results[i].release_date);
						var year = releaseDate.getFullYear();
						if (response.data.results[i].poster_path === null) {
							/// change place holder
							temp.push({
								"text": response.data.results[i].title,
								"image": "images/placeholder.svg",
								"year": year,
								"id": response.data.results[i].id
							});
						} else {
							temp.push({
								"text": response.data.results[i].title,
								"image": "https://image.tmdb.org/t/p/w342" + response.data.results[i].poster_path ,
								"year": year,
								"id": response.data.results[i].id
							});
						}
					}
					focusController.focus("backFromSearchResultsScreen");	
					$timeout(function(){
						focusController.focus("backFromSearchResultsScreen");	
						console.log("$scope.currentDepth: "+$scope.currentDepth);
					},500);

					$scope.searchResults = temp;
					jQuery('#searchResultsList').trigger('reload');
				}
				//show screen of results
				$scope.currentDepth = $scope.DEPTH.SEARCH_RESULTS;
				changeDepth($scope.DEPTH.SEARCH_RESULTS);
            });
        }
        //empty string entered
        else {
            //show string not found screen
            changeDepth($scope.DEPTH.ERROR);
            $scope.errorMessage = $scope.ERROR.NO_STRING_ENTERED;
            console.log("Error message is: " + $scope.errorMessage);
        }
    };
	/***************************************************************************** 
     * Request next page of movies from the content server
     * For screen of movies of current actor
     ****************************************************************************/
    $scope.getNextPageOfSearchResults = function() { // for search results screen
		console.log("in getNextPageOfSearchResults()");
        if ($scope.lastRetrievedPageOfResults < $scope.totalPagesOfResults) {
			var request = "https://api.themoviedb.org/3/search/movie?api_key=e88aa9ee18d8bb7b8395fd9fcc33cb39&query=" + $scope.search.string + "&page=" + (1 + $scope.lastRetrievedPageOfResults);
            $http.get(request).then(function(response) {
                $scope.searchResults2 = response.data.results;
                $scope.lastRetrievedPageOfResults++;
                var temp = [];
                for (var i = 0; i < $scope.searchResults2.length; i++) {
                    var releaseDate = new Date(response.data.results[i].release_date);
                    var year = releaseDate.getFullYear();
                    if (response.data.results[i].poster_path === null) {
                        /// change place holder
                        temp.push({
                            "text": response.data.results[i].title,
                            "image": "images/placeholder.svg",
                            "year": year,
                            "id": response.data.results[i].id
                        });
                    } else {
                        temp.push({
                            "text": response.data.results[i].title,
                            "image": "https://image.tmdb.org/t/p/w342" + response.data.results[i].poster_path,
                            "year": year,
                            "id": response.data.results[i].id
                        });
                    }
                }
                $scope.searchResults = $scope.searchResults.concat(temp);
            });
        }
    };
	/***************************************************************************** 
	 * Cleasr list of the search results
     ****************************************************************************/
    $scope.clearSearchList= function(){
    	console.log("clearing!!!");
    	$scope.searchResults = [];
    } 
    /***********************SHOW*IME*ON*SEARCH*SCREEN****************************/
    /***************************************************************************** 
     * Register additional keys used in this application
     ****************************************************************************/
    $scope.registerKeys = function() {
        var usedKeys = ['0', 'ChannelUp', 'ChannelDown', 'MediaPause','MediaPlay', 'MediaStop', 'MediaFastForward', 'MediaRewind'];
        usedKeys.forEach(
            function(keyName) {
                tizen.tvinputdevice.registerKey(keyName);
            }
        );
    };
    /***************************************************************************** 
     * Handle input from remote control of the TV
     ****************************************************************************/
    $scope.registerKeyHandler = function() {
        console.log("in registerKeyHandler()");
        document.addEventListener('keydown', function(e) {
            console.log(e.keyCode);
            switch (e.keyCode) {
                /** FUNCTIONALITY OF ADDITIONALLY REGISTERED KEYS **/
            /*          
				//show IME on 'volume up' from remote
				case 427:
					console.log("case 427");
					//show IME on screen
					$scope.showIME();
					break;
				//hide IME on 'volume down' from remote
				case 428: //key 2
					console.log("case 428");
					$scope.hideIME();
					break;
			*/

                /** REGULAR KEYS **/
                //hide IME on 'done' frome IME
                case 65376: //key done
                    console.log("case 65376");
                    //hide IME from screen
                    $scope.hideIME();
                    break;
                    //hide IME on 'cancel' frome IME
                case 65385: //key cancel
                    console.log("case 65385");
                    //hide IME from screen
                    $scope.hideIME();
                    break;
                    //hide IME on 'return' frome remote
                case 10009: //key return
                    console.log("case 10009");
                    
                    //make sure we don't exit the application with IME shown!
                    if (!$scope.isImeFocused && focusController.getCurrentDepth() === $scope.DEPTH.INDEX) {
                        tizen.application.getCurrentApplication().exit();
                    }
                    if ($scope.currentDepth == $scope.DEPTH.ERROR && $scope.errorMessage == $scope.ERROR.NO_NETWORK){
                    	tizen.application.getCurrentApplication().exit();
                    }
                    if ($scope.currentDepth == $scope.DEPTH.MOVIE_INFO || $scope.currentDepth == $scope.DEPTH.SORT 
                    		|| $scope.currentDepth == $scope.DEPTH.FILTER 
                    		|| $scope.currentDepth == $scope.DEPTH.SEARCH){
                    	$scope.launchIndex();
                    }
                    if ($scope.currentDepth == $scope.DEPTH.TRAILER ){
                    	$scope.exitTrailerScreen();	
                    }
                    if ($scope.currentDepth == $scope.DEPTH.PLOT_SCREEN || $scope.currentDepth == $scope.DEPTH.ACTOR_INFO){
                    	$scope.backToMovieScreen();
                    }
                    if ($scope.currentDepth == $scope.DEPTH.RECOMMENDED_MOVIES){
                    	$scope.exitRecommendedMovies();
                    }
                    if ($scope.currentDepth == $scope.DEPTH.ACTOR_BIO){
                    	$scope.backToActorScreen();
                    }
                    if ($scope.currentDepth == $scope.DEPTH.ACTOR_MOVIES){
                    	$scope.backFromActorsMovies();
                    }

                    if ($scope.currentDepth == $scope.DEPTH.SEARCH_RESULTS){
                    	$scope.clearSearchList();
                    	$scope.launchSearchScreen();
                    }
                    
                    break;
	
                //PAUSE
                case 19:
                	if ($scope.currentDepth == $scope.DEPTH.TRAILER 
                			&& $scope.trailerPlayer.getPlayerState() == 1){ //if video is playing
                		$scope.showControlsThenHide();
            			focusController.focus('playPauseButton');
                		focusController.select('playPauseButton');
                	}  
                	break;
                

                //PLAY
                case 415:
                	if ($scope.currentDepth == $scope.DEPTH.TRAILER 
                			&& $scope.trailerPlayer.getPlayerState() == 2){ //if video is paused
                		$scope.showControlsThenHide();
            			focusController.focus('playPauseButton');
                		focusController.select('playPauseButton');


                	}  
                	break;
                	
                //STOP - same functionality as PAUSE
                case 413:
                	if ($scope.currentDepth == $scope.DEPTH.TRAILER 
                			&& $scope.trailerPlayer.getPlayerState() == 1){ //if video is playing
                		$scope.showControlsThenHide();
            			focusController.focus('playPauseButton');
                		focusController.select('playPauseButton');
                	}  
                	break;
   
                //FF
                case 417:
                	if ($scope.currentDepth == $scope.DEPTH.TRAILER ){ 
                		$scope.showControlsThenHide();
            			focusController.focus('ffButton');
                		focusController.select('ffButton');
                	}
                	break;
                	
                //BB
                case 412:
                	if ($scope.currentDepth == $scope.DEPTH.TRAILER ){ 
                		$scope.showControlsThenHide();
            			focusController.focus('bbButton');
                		focusController.select('bbButton');
                	}
                	break;
            }
        });
    };
    /***************************************************************************** 
     * Show IME and focus input element
     ****************************************************************************/
    $scope.showIME = function() {
        var elementIME = document.querySelector('#tizenIme');
        console.log('Show IME');
        elementIME.focus();
        $scope.isImeFocused = true;
    };
    /***************************************************************************** 
     * hide IME, blur input element and focus body
     ****************************************************************************/
    $scope.hideIME = function() {
        var elementIME = document.querySelector('#tizenIme');
        console.log('Hide IME');
        document.body.focus();
        elementIME.blur();
        $scope.isImeFocused = false;
    };
    /***************************************************************************** 
     * Handle event keyup - detect key pressing
     * @param {object} data
     ****************************************************************************/
    $scope.changeIME = function(data) {
        console.log('IME data: ' + data.target.value);
    };
    /*****************************************************************************
     * Show the IME when search box is focused
     ****************************************************************************/
    $scope.onSearchFocused = function() {
        console.log("in onSearchFocused()");
        //remove input string
        $scope.search.string = '';
        var elementIME;
        if (window.tizen === undefined) {
            console.log('This application should be run on Tizen device');
            return;
        }
        //displayVersion();
        //show IME
        $scope.showIME();
        //$scope.registerKeys();
        //$scope.registerKeyHandler();
        //select IME from document
        elementIME = document.querySelector('#tizenIme');
        //handle input from IME
        elementIME.addEventListener('input', $scope.changeIME);
        //handle end of IME composition
        elementIME.addEventListener('compositionend', function() {
            console.log('compositionend');
        });
    };

	
    /*-----------------------------ERROR*SCREEN----------------------------------*/

    /*****************************************************************************
     * Return from error
     ****************************************************************************/
    $scope.backFromErrorScreen = function() {
        //return to search screen
        if ($scope.errorMessage === $scope.ERROR.NO_MOVIES_FOUND || $scope.errorMessage === $scope.ERROR.NO_STRING_ENTERED) {
            $scope.launchSearchScreen();
        }
        //return to movie info screen
        if ($scope.errorMessage === $scope.ERROR.TRAILER) {
            $scope.launchMovieScreen(undefined);
        }
    };

}); //end of application scope
