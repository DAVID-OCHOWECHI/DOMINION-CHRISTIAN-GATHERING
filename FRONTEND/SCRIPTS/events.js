const eventStorageKey = "dcg-upcoming-events";
const eventForm = document.querySelector("[data-event-form]");
const eventList = document.querySelector("[data-events-list]");
const eventStatus = document.querySelector("[data-event-status]");

if (eventForm instanceof HTMLFormElement && eventList && eventStatus) {
    const showEventStatus = (message, state = "") => {
        eventStatus.textContent = message;
        if (state) eventStatus.dataset.state = state;
        else delete eventStatus.dataset.state;
    };

    const readEvents = () => {
        let storedEvents;
        try {
            storedEvents = localStorage.getItem(eventStorageKey);
        } catch {
            showEventStatus("Browser storage is unavailable, so events cannot be saved here.", "error");
            return null;
        }

        if (!storedEvents) return [];

        let events;
        try {
            events = JSON.parse(storedEvents);
        } catch {
            showEventStatus("Saved event data could not be read. It has not been changed.", "error");
            return null;
        }

        if (!Array.isArray(events) || events.some((event) =>
            !event || typeof event.id !== "string" || typeof event.title !== "string" ||
            typeof event.date !== "string" || typeof event.location !== "string" ||
            typeof event.description !== "string" || !Number.isFinite(new Date(event.date).getTime())
        )) {
            showEventStatus("Saved event data is invalid. It has not been changed.", "error");
            return null;
        }

        return events;
    };

    const renderEvents = () => {
        const events = readEvents();
        if (!events) {
            eventList.replaceChildren();
            return;
        }

        const now = Date.now();
        const upcomingEvents = events
            .filter((event) => new Date(event.date).getTime() > now)
            .sort((first, second) => new Date(first.date).getTime() - new Date(second.date).getTime());

        eventList.replaceChildren();
        if (!upcomingEvents.length) {
            const emptyMessage = document.createElement("p");
            emptyMessage.className = "events-empty";
            emptyMessage.textContent = "No upcoming events have been added yet. Check back soon.";
            eventList.append(emptyMessage);
            return;
        }

        upcomingEvents.forEach((event) => {
            const article = document.createElement("article");
            article.className = "event-card";

            const date = document.createElement("p");
            date.className = "event-date";
            date.textContent = new Date(event.date).toLocaleString(undefined, {
                dateStyle: "long",
                timeStyle: "short"
            });

            const title = document.createElement("h3");
            title.textContent = event.title;

            const location = document.createElement("p");
            location.className = "event-location";
            location.textContent = event.location;

            article.append(date, title, location);
            if (event.description) {
                const description = document.createElement("p");
                description.className = "event-description";
                description.textContent = event.description;
                article.append(description);
            }

            const removeButton = document.createElement("button");
            removeButton.className = "event-remove";
            removeButton.type = "button";
            removeButton.textContent = "Remove event";
            removeButton.setAttribute("aria-label", `Remove ${event.title}`);
            removeButton.addEventListener("click", () => {
                const currentEvents = readEvents();
                if (!currentEvents) return;
                saveEvents(
                    currentEvents.filter((savedEvent) => savedEvent.id !== event.id),
                    "Event removed from this browser."
                );
            });
            article.append(removeButton);
            eventList.append(article);
        });
    };

    const saveEvents = (events, successMessage = "Event saved in this browser. It is not published for other visitors.") => {
        try {
            localStorage.setItem(eventStorageKey, JSON.stringify(events));
        } catch {
            showEventStatus("Browser storage is unavailable, so your event was not saved.", "error");
            return false;
        }

        showEventStatus(successMessage, "info");
        renderEvents();
        return true;
    };

    eventForm.addEventListener("submit", (event) => {
        event.preventDefault();
        if (!eventForm.reportValidity()) return;

        const formData = new FormData(eventForm);
        const eventDate = String(formData.get("date"));
        const title = String(formData.get("title")).trim();
        const location = String(formData.get("location")).trim();
        if (new Date(eventDate).getTime() <= Date.now()) {
            showEventStatus("Choose a future date and time for the event.", "error");
            return;
        }
        if (!title || !location) {
            showEventStatus("Enter an event name and location.", "error");
            return;
        }

        const events = readEvents();
        if (!events) return;

        const id = typeof globalThis.crypto?.randomUUID === "function"
            ? globalThis.crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
        events.push({
            id,
            title,
            date: eventDate,
            location,
            description: String(formData.get("description")).trim()
        });

        if (saveEvents(events)) eventForm.reset();
    });

    window.addEventListener("storage", (event) => {
        if (event.key === eventStorageKey || event.key === null) renderEvents();
    });

    renderEvents();
}
