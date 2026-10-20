const menuButton = document.querySelector(".menu-toggle");
const menu = document.querySelector(".menuLinks");

if (menuButton && menu) {
    const menuLabel = menuButton.querySelector(".sr-only");

    const closeMenu = () => {
        menu.classList.remove("is-open");
        menuButton.setAttribute("aria-expanded", "false");
        if (menuLabel) menuLabel.textContent = "Open navigation menu";
    };

    menuButton.addEventListener("click", () => {
        const isOpen = menuButton.getAttribute("aria-expanded") === "true";
        menuButton.setAttribute("aria-expanded", String(!isOpen));
        menu.classList.toggle("is-open", !isOpen);
        if (menuLabel) menuLabel.textContent = isOpen ? "Open navigation menu" : "Close navigation menu";
    });

    menu.addEventListener("click", (event) => {
        if (event.target instanceof Element && event.target.closest("a")) closeMenu();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") closeMenu();
    });
}

document.querySelectorAll("[data-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
});

const accountTabs = document.querySelectorAll("[data-account-view]");
const accountPanels = document.querySelectorAll("[data-account-panel]");

if (accountTabs.length && accountPanels.length) {
    const showAccountView = (view) => {
        accountTabs.forEach((tab) => {
            tab.setAttribute("aria-selected", String(tab.dataset.accountView === view));
        });
        accountPanels.forEach((panel) => {
            panel.hidden = panel.dataset.accountPanel !== view;
        });
    };

    accountTabs.forEach((tab) => {
        tab.addEventListener("click", () => showAccountView(tab.dataset.accountView));
    });

    if (window.location.hash === "#create-account") showAccountView("register");
}

document.querySelectorAll("[data-file-input]").forEach((input) => {
    input.addEventListener("change", () => {
        if (!(input instanceof HTMLInputElement) || !input.files?.length) return;

        const file = input.files[0];
        const maxBytes = Number(input.dataset.maxBytes);
        const fileName = document.querySelector(`[data-file-name="${input.id}"]`);
        const status = input.form?.querySelector("[data-form-status]");
        const acceptedTypes = input.accept.toLowerCase().split(",").map((type) => type.trim());
        const fileExtension = `.${file.name.split(".").pop().toLowerCase()}`;
        const isAccepted = acceptedTypes.some((type) => {
            if (type.startsWith(".")) return type === fileExtension;
            if (type.endsWith("/*")) return file.type.toLowerCase().startsWith(type.slice(0, -1));
            return type === file.type.toLowerCase();
        });

        if (!isAccepted || (maxBytes && file.size > maxBytes)) {
            input.value = "";
            if (fileName) fileName.textContent = "No file selected";
            if (status) {
                status.dataset.state = "error";
                status.textContent = !isAccepted
                    ? "That file type is not supported. Choose one of the formats listed above."
                    : `That file is too large. Choose a file smaller than ${Math.round(maxBytes / (1024 * 1024))} MB.`;
            }
            return;
        }

        if (fileName) fileName.textContent = `${file.name} · ${(file.size / (1024 * 1024)).toFixed(1)} MB`;
        if (status) {
            delete status.dataset.state;
            status.textContent = "File selected in this browser. It will not be uploaded until the backend is connected.";
        }

        if (input.id === "sermon-file") {
            const preview = document.querySelector("[data-audio-preview]");
            const player = preview?.querySelector("audio");
            if (preview && player) {
                if (player.dataset.objectUrl) URL.revokeObjectURL(player.dataset.objectUrl);
                const objectUrl = URL.createObjectURL(file);
                player.src = objectUrl;
                player.dataset.objectUrl = objectUrl;
                preview.hidden = false;
            }
        }
    });
});

document.querySelectorAll("[data-backend-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
        event.preventDefault();

        if (!(form instanceof HTMLFormElement)) return;

        const confirmation = form.elements.namedItem("password-confirm");
        const password = form.elements.namedItem("password");
        if (confirmation instanceof HTMLInputElement && password instanceof HTMLInputElement) {
            confirmation.setCustomValidity(confirmation.value === password.value ? "" : "Passwords do not match.");
        }

        if (!form.reportValidity()) return;

        const status = form.querySelector("[data-form-status]");
        if (status) {
            status.dataset.state = "info";
            status.textContent = form.dataset.backendForm === "login" || form.dataset.backendForm === "register"
                ? "The member account service is not connected yet. Your details have not been sent or saved."
                : "The upload service is not connected yet. Your details and files have not been sent or saved.";
        }
    });
});

const revealTargets = document.querySelectorAll(
    ".hero-copy, .hero-image, .page-hero-copy, .page-hero-image, .feature-card, .value-card, " +
    ".ministry-card, .reading-list article, .commitment-list article, .library-hero-inner > div, " +
    ".library-empty, .sermon-hero-inner > :not(.sound-wave), .sermon-empty, .upload-heading, " +
    ".upload-form, .upload-aside, .account-welcome, .account-card"
);

if (revealTargets.length && "IntersectionObserver" in window) {
    document.documentElement.classList.add("motion-ready");
    revealTargets.forEach((element, index) => {
        element.dataset.reveal = "";
        element.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 70}ms`);
    });

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.12, rootMargin: "0px 0px -30px 0px" });

    revealTargets.forEach((element) => revealObserver.observe(element));
}
