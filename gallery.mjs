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
    image: "image_"
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
          }
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
          }
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
          }
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
          }
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
          }
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
                this.#identifiers[from]
              ];
            }

            // Processing the modification event
            this.#events.get("moving").get("drop")(event);
          }
        ]
      ])
    ],

    [
      "moving",
      new Map([
        ["dragstart", (event) => {}],

        ["dragover", (event) => {}],

        ["dragenter", (event) => {}],

        ["dragleave", (event) => {}],

        ["dragend", (event) => {}],

        ["drop", (event) => {}]
      ])
    ],

    ["wrap", new Map([["delete", (event) => {}]])]
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
      }
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
   * @param {(File|string)} target The image for `srt` attribute
   *
   * @returns {HTMLElement} Created wrap <div> element with images and buttons
   */
  generate(order, target) {
    // Creating the wrap <div> element
    const wrap = document.createElement("div");
    wrap.classList.add("image");
    wrap.setAttribute("id", this.prefixes.wrap + order);
    wrap.setAttribute("draggable", true);

    // Creating the button <button> element
    const button = document.createElement("button");
    button.classList.add("delete");
    button.addEventListener("click", (event) => {
      // Deleting the identifier

      // Initializing index of the wrap
      const index = this.#identifiers.indexOf(this.prefixes.wrap + order);

      if (index > -1) {
        // Initialized index of the wrap

        // Deleting identifier of the wrap from the identifiers registry
        this.#identifiers.splice(index, 1);

        // Deleting the wrap
        wrap.remove();

        // Processing the `ondelete` function
        this.#events.get("wrap")?.get("delete")(event);
      }
    });

    // Creating the trash icon <i> element
    const trash = document.createElement("i");
    trash.classList.add("icon", "trash");

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
    button.appendChild(trash);
    wrap.appendChild(button);

    // Exit (success)
    return wrap;
  }

  /**
   * @name Import
   *
   * @description
   * Creating images <img> elements by loaded images
   *
   * @param {(FileList|object} files Files for importing (can be array of URL`s)
   */
  import(files) {
    // Stopping events handlers
    this.stop();

    // Initializing the identifiers registry proxy
    this.proxy();

    // Deleting deprecated images from the gallery
    this.#gallery.innerHTML = "";

    for (const [index, file] of files instanceof FileList
      ? Object.entries(files)
      : files) {
      // Iterating over files

      if (file) {
        // Initialized the file

        // Initializing the file extension
        const extension = file.name ?? file.match(/\.\w{3,4}$/)[0];

        if (this.allowed.test(extension)) {
          // Allowed the file

          // Generating HTML elements
          const wrap = this.generate(index, file);

          // Injecting HTML elements into the document
          this.#gallery.appendChild(wrap);

          // Writing into the identifiers registry
          this.#identifiers.push(wrap.getAttribute("id"));
        }
      }
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
   *
   * @returns {Promise}
   */
  async export(identifier, base64 = false) {
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
                    reader.readAsDataURL(value);
                  } else {
                    // Blob object

                    // Exit (success)
                    resolve(value);
                  }
                });
            });
          } else {
            // Base64 or HTTP

            // Exit (success)
            return content;
          }
        } catch {
          // Base64 or HTTP

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
            converted.push((await this.export(identifier)) ?? null);
          }
        }

        // Exit (success)
        return converted;
      }
    }
  }
}
