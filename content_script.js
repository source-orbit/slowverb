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
	content_script.js - Script that controls the insertion of the controls.js script into the page
	Slowverb - A Chrome Extension to slow down Spotify playback speed and add reverb
	Changes made:
		- Full rewrite and restructure of the codebase
			- Still maintained the original vanilla js + non-modular codebase for simplicity
			- Did not think it was worthwhile switching to Typescript or React for this project
		- Added reverb and reverb presets
		- Added pitch correction when changing playback speed
		- Added new interface to change playback speed and reverb
*/

/* Create our dummy script to be inserted with our code variable  */
/* insert our code as the contents of the script */
/* make our script exist on the page as, hopefully, the first script to execute. */
/* appends script again(not good practice) as close to top as possible */
/* remove script/cleanup */

// Block used to avoid setting global variables
{
	function insertControls(src) {
		try {
			assert(src, "Unable to find controls.js resource");

			const dattorroReverb = getResource("dattorroReverb.js");
			localStorage.setItem("dattorroReverb", dattorroReverb);
			const script = document.createElement("script");
			script.src = src;
			script.onload = function () {
				// console.log("chrome extension activated");
				this.remove();
			};

			// This script runs before the <head> element is created,
			// so we add the script to <html> instead.
			const insertPoint = document.head || document.documentElement;
			assert(insertPoint, "Failed to add controls.js script");

			insertPoint.appendChild(script);
		} catch (e) {
			console.error("slowverb - " + e);
		}
	}

	const controls = getResource("controls.js");
	insertControls(controls);

	/************************************/
	/********* Helper Functions *********/
	/************************************/

	function assert(condition, message) {
		if (!condition) {
			throw new Error(message);
		}
	}

	function getResource(resource) {
		return chrome.runtime.getURL(resource);
	}
}
