/*
	-- Acknowledgements --
	Original Authors of spotitySpeedExtension which this was a derivation of:
		- @intOrfloat: https://github.com/intOrfloat/spotitySpeedExtension
			- Original Author
		- @jamesEmerson112: https://github.com/jamesEmerson112/spotitySpeedExtension
			- Added support for Manifest V3
		
		Thanks to them for the original codebase and method of injecting the script into the page.
		Some original code was used as a base for this project, but it has been heavily modified and restructured.
		Some of their comments are still present in the code.
	
	-- Details --
	control.js - The main script that runs on the page
	Slowverb - A Chrome Extension to slow down Spotify playback speed and add reverb
	Changes made:
		- Full rewrite and restructure of the codebase
			- Still maintained the original vanilla js + non-modular codebase for simplicity
			- Did not think it was worthwhile switching to Typescript or React for this project
		- Added reverb and reverb presets
		- Added pitch correction when changing playback speed
		- Added new interface to change playback speed and reverb
*/

/* 
 The problem: the video/audio element is hidden and only referenced in spotify's encapsulated code
 
 This is injected into the top of the html dom as a script element when the page loads
 	- It loads before spotify's scripts and can pre-append the browser's code of document.createElement before it's used
 	- Whenever spotify's scripts execute document.createElement('video') a reference to the element created is stored in VideoElementsMade
 		- document.createElement('video') used to be an audio element until spotify started supporting videos and now it's randomly either
*/

/* A backup reference to the browser's original document.createElement */
const base = document.createElement;
/* Array of video/audio elements made by spotify's scripts */
const VideoElementsMade = [];
/* Used to check if the page is being loaded for the first time */
document.firstLoad = true;

/* Replacing the DOM's original reference to the browser's createElement function */
document.createElement = function (message) {
	/* base.apply is calling the backup reference of createElement with the arguments sent to our function and assigning it to our variable named element */
	let element = base.apply(this, arguments);
	const storedSpeed = localStorage.getItem("slowverbSpeed");
	/* we check the first argument sent to us Examp. document.createElement('video') would have message = 'video' */
	/* ignores the many document.createElement('div'), document.createElement('nav'), ect... */
	if (message === "video" || message === "audio") {
		/* Checking if spotify scripts are making a video or audio element */
		if (storedSpeed) {
			/* if the speed is stored in the site's cookie */
			element.playbackRate =
				storedSpeed; /* set the playback speed to the stored speed */
			element.defaultPlaybackRate =
				storedSpeed; /* set the default playback speed to the stored speed */
			element.preservesPitch = false;

			// To apply reverb automatically on first load
			element.onplaying = function () {
				if (!document.firstLoad) return;
				document.firstLoad = null;
				delete document.firstLoad;
				const preset = localStorage.getItem("slowverbPreset");
				if (preset && preset !== "none") {
					document.applyReverb(preset);
				}
				delete document.applyReverb;
			};
		}
		/* Add a reference to the element in our array. Arrays hold references not copies by default in javascript. */
		VideoElementsMade.push(element);
	}
	/* return the element and complete the loop so the page is allowed to be made */
	return element;
};

/* When the page is loaded completely... */
window.onload = function () {
	let dattorroReverb;

	/*****************************/
	/********** Getters **********/
	/*****************************/

	function getStoredSpeed() {
		return localStorage.getItem("slowverbSpeed");
	}
	function getDattorroReverb() {
		if (dattorroReverb) return dattorroReverb;
		dattorroReverb = localStorage.getItem("dattorroReverb");
		return dattorroReverb;
	}
	function getStoredPreset() {
		/* Gets stored speed between refreshes*/
		return localStorage.getItem("slowverbPreset");
	}

	// locally cache the dattorroReverb resource string
	dattorroReverb = getDattorroReverb();
	// locally cache the speed
	let lastSpeed = getStoredSpeed() || 1.0;
	// locally cache the preset
	let activeReverb = getStoredPreset() || "none";

	/**********************************************************************/
	/********* Setters - need to come after variable declaration **********/
	/**********************************************************************/

	function setStoredSpeed(value) {
		/* Sets variable in the site's cookie along-side spotify's stuff */
		localStorage.setItem("slowverbSpeed", value);
		lastSpeed = value;
	}

	function setStoredPreset(value) {
		/* Sets variable in the site's cookie along-side spotify's stuff */
		localStorage.setItem("slowverbPreset", value);
		activeReverb = value;
	}

	/**************************************************/
	/********** Elements to insert into page **********/
	/**************************************************/

	let input = document.createElement("input");
	input.type = "number";
	input.id = "slowverb-input";
	input.value = lastSpeed * 100;
	input.min = 60;
	input.max = 200;
	input.onchange = function () {
		validateAndChangeSpeed();
	};

	const reverbOptions = ["none", "smol", "norm", "bige", "swol", "bruh"];
	let reverbSelect = document.createElement("select");
	reverbSelect.id = "slowverb-reverbInput";
	reverbSelect.name = "reverbInput";
	let option = null;
	for (let i = 0; i < reverbOptions.length; i++) {
		option = document.createElement("option");
		option.value = reverbOptions[i];
		option.text = reverbOptions[i];
		reverbSelect.appendChild(option);
	}
	reverbSelect.value = activeReverb;
	reverbSelect.addEventListener("click", () => {
		reverbSelect.addEventListener("change", () => {
			if (reverbSelect.value === activeReverb) return;
			switch (reverbSelect.value) {
				case "smol":
					applyReverb("smol");
					break;
				case "bige":
					applyReverb("bige");
					break;
				case "swol":
					applyReverb("swol");
					break;
				case "bruh":
					applyReverb("bruh");
					break;
				case "norm":
					applyReverb("norm");
					break;
				default:
					resetReverb();
					break;
			}
		});
	});

	/************************************************/
	/********** Dattorro Reverb Parameters **********/
	/************************************************/

	const parametersList = [
		"preDelay",
		"bandwidth",
		"inputDiffusion1",
		"inputDiffusion2",
		"decay",
		"decayDiffusion1",
		"decayDiffusion2",
		"damping",
		"excursionRate",
		"excursionDepth",
		"dry",
		"wet",
	];
	// Adapted presets can be found from line 153: https://github.com/khoin/DattorroReverbNode/blob/master/index.html
	// Adapted from the original "bige" (2nd) preset from: https://github.com/khoin/DattorroReverbNode/blob/master/index.html
	const bigePreset = {
		preDelay: 0,
		bandwidth: 0.7011,
		inputDiffusion1: 0.7331,
		inputDiffusion2: 0.4534,
		decay: 0.8271,
		decayDiffusion1: 0.7839,
		decayDiffusion2: 0.1992,
		damping: 0.5975,
		excursionRate: 0,
		excursionDepth: 0,
		dry: 0.7015,
		wet: 0.3012,
	};
	// Adapted from the "frez" (3rd) preset from: https://github.com/khoin/DattorroReverbNode/blob/master/index.html
	const frezPreset = {
		preDelay: 0,
		bandwidth: 0.9,
		inputDiffusion1: 0.75,
		inputDiffusion2: 0.625,
		decay: 1,
		decayDiffusion1: 0.5,
		decayDiffusion2: 0.711,
		damping: 0.05,
		excursionRate: 0.3,
		excursionDepth: 1.4,
		dry: 0.7015,
		wet: 0.3012,
	};
	// Some preset names were from: https://github.com/khoin/DattorroReverbNode/blob/master/index.html
	const presets = {
		smol: [
			bigePreset.preDelay,
			bigePreset.bandwidth,
			bigePreset.inputDiffusion1,
			bigePreset.inputDiffusion2,
			bigePreset.decay,
			bigePreset.decayDiffusion1,
			bigePreset.decayDiffusion2,
			bigePreset.damping,
			bigePreset.excursionRate,
			bigePreset.excursionDepth,
			bigePreset.dry,
			bigePreset.wet,
		],
		norm: [
			bigePreset.preDelay,
			bigePreset.bandwidth,
			bigePreset.inputDiffusion1,
			bigePreset.inputDiffusion2,
			bigePreset.decay,
			bigePreset.decayDiffusion1,
			bigePreset.decayDiffusion2,
			bigePreset.damping,
			bigePreset.excursionRate + 2,
			bigePreset.excursionDepth + 2,
			bigePreset.dry,
			bigePreset.wet,
		],
		bige: [
			bigePreset.preDelay,
			bigePreset.bandwidth,
			bigePreset.inputDiffusion1,
			bigePreset.inputDiffusion2 + 0.1,
			bigePreset.decay,
			bigePreset.decayDiffusion1 - 0.1,
			bigePreset.decayDiffusion2 + 0.5,
			bigePreset.damping - 0.2,
			bigePreset.excursionRate + 2,
			bigePreset.excursionDepth + 2,
			bigePreset.dry,
			bigePreset.wet,
		],
		swol: [
			frezPreset.preDelay,
			frezPreset.bandwidth,
			frezPreset.inputDiffusion1,
			frezPreset.inputDiffusion2,
			frezPreset.decay - 0.12,
			frezPreset.decayDiffusion1,
			frezPreset.decayDiffusion2,
			frezPreset.damping + 0.155,
			frezPreset.excursionRate,
			frezPreset.excursionDepth,
			frezPreset.dry,
			frezPreset.wet,
		],
		bruh: [
			frezPreset.preDelay,
			frezPreset.bandwidth,
			frezPreset.inputDiffusion1 - 0.4,
			frezPreset.inputDiffusion2,
			frezPreset.decay - 0.28,
			frezPreset.decayDiffusion1,
			frezPreset.decayDiffusion2,
			frezPreset.damping + 0.175,
			frezPreset.excursionRate,
			frezPreset.excursionDepth,
			frezPreset.dry - 0.2,
			frezPreset.wet + 0.2,
		],
	};
	let parameters = null;

	// Add input element to page
	function addInput(element) {
		/* adds speed input next to volume bar */
		try {
			document
				.getElementsByClassName("volume-bar")[0]
				.appendChild(element);
		} catch {
			/*volume-bar doesnt exist yet so lets try again in 1 second*/
			setTimeout(() => addInputs(element), 1000);
			return;
		}
	}

	// Add input and reverbSelect within a vertical flex container
	function addInputs() {
		const container = document.createElement("div");
		container.id = "slowverb-container";
		container.appendChild(input);
		container.appendChild(reverbSelect);
		addInput(container);
	}

	/************************************/
	/********** Speed Controls **********/
	/************************************/

	function videosChangeSpeed(val) {
		for (let i = 0; i < VideoElementsMade.length; i++) {
			/* change speed for all elements found */
			/* val is clamped to range 0.0625 - 16.0 https://stackoverflow.com/a/32320020 */
			VideoElementsMade[i].playbackRate = val;
			VideoElementsMade[i].defaultPlaybackRate = val;

			// Don't preserve pitch
			VideoElementsMade[i].preservesPitch = false;
		}
	}

	function validateAndChangeSpeed(value) {
		let val = parseFloat(value || input.value / 100);
		if (!isNaN(val) && val !== lastSpeed && val >= 0.6 && val <= 2.0) {
			/* only change if input is valid and it changed */
			setStoredSpeed(val);
			videosChangeSpeed(val);
		}
	}
	function ensureSpeedNotChanged() {
		/* sometimes playbackRate is set back to 1.0 by spotify's code so timeout just ensures it goes the speed the user desires */
		setTimeout(function () {
			try {
				/* within try catch so that if an error happens timeout wouldnt be called again. */
				validateAndChangeSpeed(lastSpeed);
			} catch {}
			/* call timeout again which starts the loop and eventually it will come back here */
			ensureSpeedNotChanged();
		}, 500);
	}

	/************************************/
	/********** Reverb Controls *********/
	/************************************/

	// Reset reverb to none
	function resetReverb() {
		if (window.audioContext) {
			if (activeReverb === "none") return;
			window.videoSource.disconnect();
			window.videoSource.connect(window.audioContext.destination);
			setStoredPreset("none");
		}
	}

	// Initialise reverb parameters
	function initReverbParameters(reverb) {
		if (parameters) return;
		parameters = {};
		parametersList.forEach((parameter) => {
			parameters[parameter] = reverb.parameters.get(parameter);
		});
	}

	// Apply reverb preset to audio worklet node
	function applyReverbParameters(reverb, preset) {
		initReverbParameters(reverb);
		const presetVals = presets[preset];
		for (let i = 0; i < parametersList.length; i++) {
			const parameter = parametersList[i];
			const value = presetVals[i];
			parameters[parameter] = value;
			reverb.parameters
				.get(parameter)
				.linearRampToValueAtTime(
					value,
					window.audioContext.currentTime + 0.19
				);
		}
	}

	// Apply reverb preset to video
	async function applyReverb(preset) {
		setStoredPreset(preset);

		window.video = VideoElementsMade[0];
		const video = window.video;
		if (!video) {
			console.error("slowverb - video not found");
			return;
		}

		let audioContext = window.audioContext;
		if (!window.audioContext) {
			window.audioContext = new AudioContext();
			audioContext = window.audioContext;
		}

		let gain = window.gain;
		if (!window.gain) {
			gain = audioContext.createGain();
			window.gain = gain;
		}

		let source = window.videoSource;
		if (!window.videoSource) {
			window.videoSource = audioContext.createMediaElementSource(video);
			source = window.videoSource;
			if (!source) {
				console.error("slowverb - source unable to be created found");
				return;
			}
		}

		const resource = getDattorroReverb();
		if (!resource) return;

		// Add audio worklet node
		await audioContext.audioWorklet.addModule(resource);
		if (!window.reverb) {
			window.reverb = new AudioWorkletNode(
				audioContext,
				"DattorroReverb",
				{
					outputChannelCount: [2],
				}
			);
		}
		const reverb = window.reverb;

		// Disconnect to ensure clean connection
		source.disconnect();

		// Source -> Gain -> Reverb -> Destination
		// This way, we can disconnect gain and reverb to reset reverb
		// leaving Source -> Destination

		// Establish connection between source and gain
		source.connect(gain);
		gain.connect(reverb);

		// Connect reverb to destination
		reverb.connect(audioContext.destination);

		applyReverbParameters(reverb, preset);

		activeReverb = preset;
	}
	document.applyReverb = applyReverb;

	addInputs();
	ensureSpeedNotChanged();
};
