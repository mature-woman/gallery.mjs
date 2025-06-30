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
 * import gallery from "https://codepen.io/mirzaev-sexy/pen/RNPdYvv.js";
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
   * @name Events
   *
   * @type {Map}
   *
   * @protected
   */
  #events = new Map([
    [
      "dragstart",
      (event) => {
        // Disabling default actions
        this.#dragged = event.target.getAttribute("id");

        // Allowing moving
        event.dataTransfer.effectAllowed = "move";
      }
    ],

    [
      "dragover",
      (event) => {
        // Disabling default actions
        event.preventDefault();

        // Allowing moving
        event.dataTransfer.dropEffect = "move";
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
          wrap.target.classList.remove("target");
        }
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
      }
    ]
  ]);

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
   **/
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
    // Initializing the identifiers registry
    this.#identifiers = new Proxy([], {
      set: (target, property, value) => {
        // Postponing the update with a microtask
        this.#update ??= Promise.resolve().then(() => {
          // Deinitializing the update promise
          this.#update = null;

          // Generating the order row (can be deleted without any problems)
          document.getElementById("order").textContent =
            "Order: " + target.join(", ");

          // Re-ordering wraps <div> elements by the identifiers registry
          target.forEach((identifier) => {
            this.#gallery.appendChild(document.getElementById(identifier));
          });
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
    for (const [event, handler] of this.#events)
      this.#gallery.addEventListener(event, handler);
  }

  /**
   * @name Stop
   *
   * @description
   * Stop handling moving of images
   */
  stop() {
    // Deinitializing events listeners
    for (const [event, handler] of this.#events)
      this.#gallery.removeEventListener(event, handler);
  }

  /**
   * @name Import
   *
   * @description
   * Creating images <img> elements by loaded images
   *
   * @param {FileList} files Loaded images
   */
  import(files) {
    // Stopping events handlers
    this.stop();

    // Initializing the identifiers registry proxy
    this.proxy();

    // Deleting deprecated images from the gallery
    this.#gallery.innerHTML = "";

    for (let i = 0; i < files.length; i++) {
      // Iterating over imported images

      // Creating the wrap <div> element
      const wrap = document.createElement("div");
      wrap.classList.add("image");
      wrap.setAttribute("id", this.prefixes.wrap + i);
      wrap.setAttribute("draggable", true);

      // Creating the button <button> element
      const button = document.createElement("button");
      button.classList.add("delete");
      button.addEventListener("click", (event) => {
        // Deleting the identifier

        // Initializing index of the wrap
        const index = this.#identifiers.indexOf(this.prefixes.wrap + i);

        if (index > -1) {
          // Initialized index of the wrap

          // Deleting identifier of the wrap from the identifiers registry
          this.#identifiers.splice(index, 1);

          // Deleting the wrap
          wrap.remove();
        }
      });

      // Creating the trash icon <i> element
      const trash = document.createElement("i");
      trash.classList.add("icon", "trash");

      // Creating the image <img> element
      const image = document.createElement("img");
      image.setAttribute("id", this.prefixes.image + i);
      image.setAttribute("draggable", false);
      image.setAttribute("src", URL.createObjectURL(files[i]));

      // Writing into the gallery
      button.appendChild(trash);
      wrap.appendChild(image);
      wrap.appendChild(button);
      this.#gallery.appendChild(wrap);

      // Writing into the identifiers registry
      this.#identifiers.push(wrap.getAttribute("id"));
    }

    // Starting events handlers
    this.start();
  }
}
