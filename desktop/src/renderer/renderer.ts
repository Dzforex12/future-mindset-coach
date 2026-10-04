const openCoachButton = document.querySelector<HTMLButtonElement>("#open-coach");
const launchStatus = document.querySelector<HTMLElement>("#launch-status");

openCoachButton?.addEventListener("click", async () => {
    if (launchStatus) launchStatus.textContent = "Opening Coach…";

    try {
        await window.coachDesktop.openCoach();
        if (launchStatus) launchStatus.textContent = "Coach is open in the desktop app.";
    } catch {
        if (launchStatus) launchStatus.textContent = "Could not open Coach.";
    }
});
