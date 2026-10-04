const openCoachButton = document.querySelector<HTMLButtonElement>("#open-coach");
const launchStatus = document.querySelector<HTMLElement>("#launch-status");

openCoachButton?.addEventListener("click", async () => {
    if (launchStatus) launchStatus.textContent = "Opening Future Mindset Coach…";

    try {
        await window.coachDesktop.openCoach();
        if (launchStatus) launchStatus.textContent = "Future Mindset Coach opened in your browser.";
    } catch {
        if (launchStatus) launchStatus.textContent = "Could not open Future Mindset Coach.";
    }
});
