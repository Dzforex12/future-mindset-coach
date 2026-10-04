export function getLocalDateKey(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function getLocalWeekKey(date = new Date()): string {
    const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayOfWeek = (monday.getDay() + 6) % 7;
    monday.setDate(monday.getDate() - dayOfWeek);
    return getLocalDateKey(monday);
}

export function getLocalDateKeysForWeek(weekKey: string): string[] {
    const [year, month, day] = weekKey.split("-").map(Number);
    const monday = new Date(year, month - 1, day);
    if (!Number.isFinite(monday.getTime()) || getLocalDateKey(monday) !== weekKey) {
        return [];
    }

    return Array.from({ length: 7 }, (_, index) => {
        const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index);
        return getLocalDateKey(date);
    });
}

export function getLocalMonthKey(date = new Date()): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}
