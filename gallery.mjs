"use strict";

/**
 * @name gallery.mjs
 *
 * @description
 * Module for creating galleries with re-ordering
 *
 * @class
 * @public
 *
 * @example
 * import gallery from "https://git.svoboda.works/mirzaev/gallery.mjs/raw/branch/stable/gallery.mjs";
 *
 * // Initializing the instance
 * const instance = new gallery(
 *   document.getElementById("wrap"),
 *   document.getElementById("images"),
 *   document.getElementById("gallery"),
 *   true
 * );
 *
 * {@link https://git.svoboda.works/mirzaev/gallery.mjs}
 * {@link https://codepen.io/mirzaev-sexy/pen/RNPdYvv}
 *
 * @todo 1. Instead of `ascend()`` create `remember()` and `restore()` methods
 *
 * @license http://www.wtfpl.net/ Do What The Fuck You Want To Public License
 * @author Arsen Mirzaev Tatyano-Muradovich <arsen@mirzaev.sexy>
 */
export default class gallery {
	/**
	 * @name Wrap
	 *
	 * @description
	 * Wrap for the gallery
	 *
	 * @type {HTMLElement}
	 *
	 * @protected
	 */
	#wrap;

	/**
	 * @name Wrap (get)
	 *
	 * @description
	 * Wrap for the gallery
	 *
	 * @return {HTMLElement}
	 *
	 * @public
	 */
	get wrap() {
		return this.#wrap;
	}

	/**
	 * @name Input
	 *
	 * @description
	 * Input for importing images
	 *
	 * @type {HTMLInputElement}
	 *
	 * @protected
	 */
	#input;

	/**
	 * @name Input (get)
	 *
	 * @description
	 * Input for importing images
	 *
	 * @return {HTMLInputElement}
	 *
	 * @public
	 */
	get input() {
		return this.#input;
	}

	/**
	 * @name Gallery
	 *
	 * @description
	 * Wrap for images <img> elements (`flex-flow: row wrap`)
	 *
	 * @type {HTMLElement}
	 *
	 * @protected
	 */
	#gallery;

	/**
	 * @name Gallery (get)
	 *
	 * @description
	 * Wrap for images <img> elements (`flex-flow: row wrap`)
	 *
	 * @return {HTMLElement}
	 *
	 * @public
	 */
	get gallery() {
		return this.#gallery;
	}

	/**
	 * @name Identifiers
	 *
	 * @description
	 * Identifiers registry of loaded images (array proxy)
	 *
	 * @see https://stackoverflow.com/a/76599646 by Alexander Nenashev
	 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
	 *
	 * @type {Proxy}
	 *
	 * @protected
	 */
	#identifiers;

	/**
	 * @name Identifiers (get)
	 *
	 * @description
	 * Identifiers registry of loaded images (array proxy)
	 *
	 * @see https://stackoverflow.com/a/76599646 by Alexander Nenashev
	 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
	 *
	 * @return {array}
	 *
	 * @public
	 */
	get identifiers() {
		return this.#identifiers;
	}

	/**
	 * @name Update
	 *
	 * @type {Promise|null}
	 *
	 * @protected
	 */
	#update;

	/**
	 * @name Prefixes
	 *
	 * @description
	 * Prefixes for identifiers
	 *
	 * @type {object}
	 */
	prefixes = {
		wrap: "",
		image: "image_",
	};

	/**
	 * @name Allowed
	 *
	 * @description
	 * Regular expression for checking matching to images extensions (not MIME-types)
	 *
	 * @type {RegExp}
	 */
	allowed = /\.(jpe?g|png|gif|webp)$/i;

	/**
	 * @name Dragged
	 *
	 * @description
	 * Buffer of currently dragged wrap identifier
	 *
	 * @type {string|number}
	 *
	 * @protected
	 */
	#dragged;

	/**
	 * @name Dragged (get)
	 *
	 * @description
	 * Buffer of currently dragged wrap identifier
	 *
	 * @type {string|number}
	 *
	 * @public
	 */
	get dragged() {
		return this.#dragged;
	}

	/**
	 * @name Events
	 *
	 * @type {Map}
	 *
	 * @protected
	 */
	#events = new Map([
		[
			"system",
			new Map([
				[
					"dragstart",
					(event) => {
						// Disabling default actions
						this.#dragged = event.target.getAttribute("id");

						// Allowing moving
						event.dataTransfer.effectAllowed = "move";

						// Processing the modification event
						this.#events.get("moving").get("dragstart")(event);
					},
				],

				[
					"dragover",
					(event) => {
						// Disabling default actions
						event.preventDefault();

						// Allowing moving
						event.dataTransfer.dropEffect = "move";

						// Processing the modification event
						this.#events.get("moving").get("dragover")(event);
					},
				],

				[
					"dragenter",
					(event) => {
						// Searching for the wrap
						const wrap = event.target.closest("div.image");

						if (wrap?.getAttribute("id") !== this.#dragged) {
							// Wrap is not currently draggable wrap

							// Writing class about targeting
							wrap?.classList.add("target");
						}

						// Processing the modification event
						this.#events.get("moving").get("dragenter")(event);
					},
				],

				[
					"dragleave",
					(event) => {
						// Searching for the closest parent wrap
						const wrap = event.target.closest("div.image");

						if (wrap instanceof HTMLElement) {
							// Found the wrap

							// Deleting class about targeting
							wrap.classList.remove("target");
						}

						// Processing the modification event
						this.#events.get("moving").get("dragleave")(event);
					},
				],

				[
					"dragend",
					(event) => {
						// Searching for the closest parent wrap
						const wrap = event.target.closest("div.image");

						if (wrap instanceof HTMLElement) {
							// Found the wrap

							// Deleting class about targeting
							wrap.classList.remove("target");
						}

						// Processing the modification event
						this.#events.get("moving").get("dragend")(event);
					},
				],

				[
					"drop",
					(event) => {
						// Searching for the closest parent wrap
						const wrap = event.target.closest("div.image");

						if (
							wrap instanceof HTMLElement &&
							wrap.getAttribute("id") &&
							wrap.getAttribute("id") !== this.#dragged
						) {
							// Found the wrap and has it identifier and it not currently draggable wrap

							// Deleting class about targeting from every wrap
							this.#gallery
								.querySelector("div.image.target")
								?.classList.remove("target");

							// Initializing indexes of wraps in the identifiers registry
							const from = this.#identifiers.indexOf(this.#dragged);
							const to = this.#identifiers.indexOf(wrap.getAttribute("id"));

							// Swapping wraps
							[this.#identifiers[from], this.#identifiers[to]] = [
								this.#identifiers[to],
								this.#identifiers[from],
							];
						}

						// Processing the modification event
						this.#events.get("moving").get("drop")(event);
					},
				],
			]),
		],

		[
			"moving",
			new Map([
				["dragstart", async (event) => {}],

				["dragover", async (event) => {}],

				["dragenter", async (event) => {}],

				["dragleave", async (event) => {}],

				["dragend", async (event) => {}],

				["drop", async (event) => {}],
			]),
		],

		["wrap", new Map([["generated", async (wrap, order) => {}]])],

		[
			"import",
			new Map([
				["one", async (wrap) => {}],
				["total", async (wraps) => {}],
			]),
		],

		[
			"export",
			new Map([
				["one", async (src) => {}],
				["total", async (converted) => {}],
			]),
		],
	]);

	/**
	 * @name Events (get)
	 *
	 * @type {Map}
	 *
	 * @public
	 */
	get events() {
		return this.#events;
	}

	/**
	 * @name Constructor
	 *
	 * @description
	 * Initialize the instance
	 *
	 * @param {HTMLElement} wrap The wrap element
	 * @param {HTMLInputElement} input The input <input> element
	 * @param {HTMLElement} gallery The gallery element
	 * @param {boolean} [inject=false] Write the instance into the wrap element?
	 */
	constructor(wrap, input, gallery, inject = false) {
		if (wrap instanceof HTMLElement) {
			// Initialized the wrap element

			// Writing the wrap
			this.#wrap = wrap;

			// Writing the instance into the wrap element
			if (inject) this.#wrap.gallery = this;
		}

		if (input instanceof HTMLInputElement) {
			// Initialized the input <input> element

			// Writing the input
			this.#input = input;
		}

		if (gallery instanceof HTMLElement) {
			// Initialized the gallery element

			// Writing the gallery
			this.#gallery = gallery;
		}

		// Initializing the identifiers registry proxy
		this.proxy();

		// Synchronizing the identifiers registry with images in the gallery element
		this.#identifiers.push(
			...[...this.#gallery.querySelectorAll("div.image")].map((image) =>
				image.getAttribute("id")
			)
		);
	}

	/**
	 * @name Proxy
	 *
	 * @description
	 * Initialize the identifiers registry proxy
	 */
	proxy() {
		// Initializing the identifiers registry proxy
		this.#identifiers = new Proxy([], {
			set: (target, property, value) => {
				// Postponing the update with a microtask
				this.#update ??= Promise.resolve().then(() => {
					// Deinitializing the update promise
					this.#update = null;

					// Re-ordering wraps <div> elements by the identifiers registry
					target.forEach((identifier) =>
						this.#gallery.appendChild(document.getElementById(identifier))
					);
				});

				// Regenerating the identifiers registry and return (success)
				return Reflect.set(target, property, value);
			},
		});
	}

	/**
	 * @name Ascending
	 *
	 * @description
	 * Sort images in ascending order
	 */
	ascending() {
		// Sorting
		this.#identifiers.sort((a, b) => a - b);
	}

	/**
	 * @name Start
	 *
	 * @description
	 * Start handling moving of images
	 */
	start() {
		// Initializing events listeners
		for (const [event, handler] of this.#events.get("system")) {
			this.#gallery.addEventListener(event, handler);
		}
	}

	/**
	 * @name Stop
	 *
	 * @description
	 * Stop handling moving of images
	 */
	stop() {
		// Deinitializing events listeners
		for (const [event, handler] of this.#events.get("system")) {
			this.#gallery.removeEventListener(event, handler);
		}
	}

	/**
	 * @name Generate
	 *
	 * @description
	 * Create the wrap with images and buttons
	 *
	 * @param {number|string} order Number for generating identifiers
	 * @param {(File|string)} target The image for `src` attribute
	 *
	 * @returns {HTMLElement} Created wrap <div> element with images and buttons
	 */
	generate(order, target) {
		// Creating the wrap <div> element
		const wrap = document.createElement("div");
		wrap.classList.add("image");
		wrap.setAttribute("id", this.prefixes.wrap + order);
		wrap.setAttribute("draggable", true);

		// Creating the image <img> element
		const image = document.createElement("img");
		image.setAttribute("id", this.prefixes.image + order);
		image.setAttribute("draggable", false);
		image.setAttribute(
			"src",
			target instanceof File
				? window.URL.createObjectURL(target)
				: target + "?updated=" + Date.now()
		);

		// Assembling
		wrap.appendChild(image);

		// Processing the `generated` wrap event function
		this.#events.get("wrap")?.get("generated")(wrap, order);

		// Exit (success)
		return wrap;
	}

	/**
	 * @name Delete
	 *
	 * @description
	 * Delete the wrap element and its identifier from the registry
	 *
	 * @param {HTMLElement} wrap The wrap
	 *
	 * @returns {boolean} Is the wrap was deleted?
	 */
	delete(wrap) {
		// Initializing identifier of the wrap
		const identifier = wrap.getAttribute("id");

		// Initializing index of the wrap
		const index = this.#identifiers.indexOf(identifier);

		if (index > -1) {
			// Initialized index of the wrap

			// Deleting identifier of the wrap from the identifiers registry
			this.#identifiers.splice(index, 1);

			// Deleting the wrap
			wrap.remove();

			// Exit (success)
			return true;
		}

		// Exit (fail)
		return false;
	}

	/**
	 * @name Import
	 *
	 * @description
	 * Creating images <img> elements by loaded images
	 *
	 * We can not change `FileList` content of `<input type="file">`,
	 * so if you add images via `gallery.import()`,
	 * do not rely on the contents of the `<input>` element
	 *
	 * Use `gallery.export()` instead
	 *
	 * @param {(FileList|object} files Files for importing (can be array of URL`s)
	 * @param {boolean} reverse Reverse the files registry?
	 * @param {boolean} silent Do not processing events?
	 */
	import(files, reverse = false, silent = false) {
		// Stopping events handlers
		this.stop();

		// Initializing the identifiers registry proxy
		this.proxy();

		// Deleting deprecated images from the gallery
		this.#gallery.innerHTML = "";

		// Initializing the imported wraps registry
		const imported = new Set();

		// Initializing the registry of files
		const registry = files instanceof FileList ? Object.entries(files) : files;

		for (const [index, file] of reverse ? registry.reverse() : reverse) {
			// Iterating over files

			if (file) {
				// Initialized the file

				// Initializing the file extension
				const extension = file.name ?? file.match(/\.\w{3,4}$/)?.[0];

				if (this.allowed.test(extension)) {
					// Allowed the file

					// Generating HTML elements
					const wrap = this.generate(index, file);

					// Injecting HTML elements into the document
					this.#gallery.appendChild(wrap);

					// Writing into the identifiers registry
					this.#identifiers.push(wrap.getAttribute("id"));

					// Writing into the imported wraps registry
					imported.add(wrap);

					if (!silent) {
						// Requested processing events

						// Processing the `one` import event function
						this.#events.get("import")?.get("one")(wrap);
					}
				}
			}
		}

		if (!silent) {
			// Requested processing events

			// Processing the `total` import event function
			this.#events.get("import")?.get("total")(imported);
		}

		// Starting events handlers
		this.start();
	}

	/**
	 * @name Export
	 *
	 * @description
	 * Collect images and convert to Blob object or Base64 string
	 *
	 * @param {(string|number)} [identifier] Identifier of the wrap
	 * @param {boolean} [base64=false] Convert to Base64 string instead of Blob object
	 * @param {boolean} silent Do not processing events?
	 *
	 * @returns {Promise}
	 */
	async export(identifier, base64 = false, silent = false) {
		// Initializing the reader
		const reader = new FileReader();

		if (typeof identifier === "string" || typeof identifier === "number") {
			// Requested specified image

			// Initializing the image
			const image = this.#gallery.querySelector(
				"div.image#" + CSS.escape(identifier) + ">img"
			);

			if (image instanceof HTMLImageElement) {
				// Initialized the image <img> element

				// Initializing the image content
				const content = image.getAttribute("src")?.split("?")[0];

				try {
					if (new URL(content).protocol === "blob:") {
						// Blob

						// Exit (success/fail)
						return new Promise((resolve) => {
							// Initializing listener for the "LoadEnd" event
							reader.onloadend = () => resolve(reader.result);

							fetch(content)
								.then((r) => r.blob())
								.then((value) => {
									// Converted "blob:..." string to Blob object

									if (base64) {
										// Base64 string

										// Converting blob to base64
										const converted = reader.readAsDataURL(value);

										if (!silent) {
											// Requested processing events

											// Processing the `one` export event function
											this.#events.get("export")?.get("one")(converted);
										}

										// Exit (success)
										resolve(converted);
									} else {
										// Blob object

										if (!silent) {
											// Requested processing events

											// Processing the `one` export event function
											this.#events.get("export")?.get("one")(value);
										}

										// Exit (success)
										resolve(value);
									}
								});
						});
					} else {
						// Base64 or HTTP

						if (!silent) {
							// Requested processing events

							// Processing the `one` export event function
							this.#events.get("export")?.get("one")(content);
						}

						// Exit (success)
						return content;
					}
				} catch {
					// Base64 or HTTP

					if (!silent) {
						// Requested processing events

						// Processing the `one` export event function
						this.#events.get("export")?.get("one")(content);
					}

					// Exit (success)
					return content;
				}
			}
		} else {
			// Requested all images

			// Initializing wraps
			const wraps = this.#gallery.querySelectorAll("div.image");

			if (wraps.length > 0) {
				// Initialized wraps

				// Initialize the converted images buffer
				const converted = [];

				for (const wrap of wraps) {
					// Iterating over images

					// Initializing the wrap identifier
					const identifier = wrap.getAttribute("id");

					if (
						typeof identifier === "string" ||
						typeof identifier === "number"
					) {
						// Initialized the wrap identifier

						// Converting the image and writing into the converted images buffer
						converted.push(
							(await this.export(identifier, base64, silent)) ?? null
						);
					}
				}

				if (!silent) {
					// Requested processing events

					// Processing the `total` export event function
					this.#events.get("export")?.get("total")(converted);
				}

				// Exit (success)
				return converted;
			}
		}
	}
}
