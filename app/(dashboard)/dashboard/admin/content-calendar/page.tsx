"use client";
import {useEffect, useState} from "react";
import {ChevronLeft, ChevronRight, Plus, Calendar, Trash2, Edit} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Input, Label, Badge} from "@/components/ui/form-elements";
import {Card, CardContent} from "@/components/ui/card";
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter} from "@/components/ui/dialog";

interface CalendarItem {
    _id: string;
    title: string;
    contentType: string;
    status: string;
    scheduledDate: string;
    targetKeyword?: string;
    color: string;
    notes?: string;
}

const STATUS_COLORS: Record<string, string> = {
    idea: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    outline: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    draft: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    review: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    scheduled: "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300",
    published: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
};

const TYPE_EMOJI: Record<string, string> = {
    blog: "📝", social: "📱", newsletter: "📧", video: "🎥", podcast: "🎙️", infographic: "📊",
};

export default function ContentCalendarPage() {
    const [items, setItems] = useState<CalendarItem[]>([]);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showAdd, setShowAdd] = useState(false);
    const [editItem, setEditItem] = useState<CalendarItem | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>("");
    const [isSaving, setIsSaving] = useState(false);
    const [form, setForm] = useState({
        title: "", contentType: "blog", status: "idea",
        scheduledDate: "", targetKeyword: "", notes: "", color: "#4F46E5",
    });

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth() + 1;

    const fetchItems = async () => {
        const res = await fetch(`/api/content-calendar?month=${month}&year=${year}`);
        const d = await res.json();
        if (d.success) setItems(d.data);
    };

    useEffect(() => {
        fetchItems();
    }, [month, year]);

    // Build calendar grid
    const firstDay = new Date(year, month - 1, 1).getDay();
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = Array.from({length: firstDay + daysInMonth}, (_, i) =>
        i < firstDay ? null : i - firstDay + 1
    );

    const itemsForDay = (day: number) => {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        return items.filter((item) => item.scheduledDate.slice(0, 10) === dateStr);
    };

    const openAdd = (day: number) => {
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        setSelectedDate(dateStr);
        setForm({
            title: "",
            contentType: "blog",
            status: "idea",
            scheduledDate: dateStr,
            targetKeyword: "",
            notes: "",
            color: "#4F46E5"
        });
        setShowAdd(true);
    };

    const handleSave = async () => {
        if (!form.title.trim()) return;
        setIsSaving(true);
        const url = editItem ? `/api/content-calendar/${editItem._id}` : "/api/content-calendar";
        const method = editItem ? "PUT" : "POST";
        const res = await fetch(url, {
            method,
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(form),
        });
        const d = await res.json();
        if (d.success) {
            setShowAdd(false);
            setEditItem(null);
            fetchItems();
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        await fetch(`/api/content-calendar/${id}`, {method: "DELETE"});
        fetchItems();
    };

    const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-indigo-500"/> Content Calendar
                    </h1>
                    <p className="text-muted-foreground text-sm">Plan and schedule your content pipeline</p>
                </div>
            </div>

            {/* Month nav */}
            <div className="flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(year, month - 2, 1))}>
                    <ChevronLeft className="h-4 w-4"/>
                </Button>
                <h2 className="font-bold text-lg">{MONTH_NAMES[month - 1]} {year}</h2>
                <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date(year, month, 1))}>
                    <ChevronRight className="h-4 w-4"/>
                </Button>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2">
                {Object.entries(STATUS_COLORS).map(([status, cls]) => (
                    <span key={status}
                          className={`text-xs px-2 py-0.5 rounded-full capitalize font-medium ${cls}`}>{status}</span>
                ))}
            </div>

            {/* Calendar grid */}
            <div className="border rounded-xl overflow-hidden">
                <div className="grid grid-cols-7 bg-muted/40">
                    {DAY_NAMES.map((d) => (
                        <div key={d} className="py-2 text-center text-xs font-semibold text-muted-foreground">{d}</div>
                    ))}
                </div>
                <div className="grid grid-cols-7 divide-x divide-y border-t">
                    {days.map((day, i) => {
                        const dayItems = day ? itemsForDay(day) : [];
                        const isToday = day === new Date().getDate() && month === new Date().getMonth() + 1 && year === new Date().getFullYear();
                        return (
                            <div
                                key={i}
                                className={`min-h-[90px] p-1.5 ${day ? "hover:bg-muted/20 cursor-pointer" : "bg-muted/10"} ${isToday ? "bg-indigo-50 dark:bg-indigo-950/20" : ""}`}
                                onClick={() => day && openAdd(day)}
                            >
                                {day && (
                                    <>
                    <span
                        className={`text-xs font-medium ${isToday ? "bg-indigo-600 text-white rounded-full w-5 h-5 flex items-center justify-center" : "text-muted-foreground"}`}>
                      {day}
                    </span>
                                        <div className="mt-0.5 space-y-0.5">
                                            {dayItems.slice(0, 3).map((item) => (
                                                <div
                                                    key={item._id}
                                                    className={`text-[10px] px-1.5 py-0.5 rounded cursor-pointer flex items-center gap-1 truncate ${STATUS_COLORS[item.status]}`}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditItem(item);

                                                        setForm({
                                                            title: item.title,
                                                            contentType: item.contentType,
                                                            status: item.status,
                                                            scheduledDate: item.scheduledDate.slice(0, 10),
                                                            targetKeyword: item.targetKeyword || "",
                                                            notes: item.notes || "",
                                                            color: item.color
                                                        });
                                                        setShowAdd(true);
                                                    }}
                                                >
                                                    <span>{TYPE_EMOJI[item.contentType]}</span>
                                                    <span className="truncate">{item.title}</span>
                                                </div>
                                            ))}
                                            {dayItems.length > 3 && (
                                                <p className="text-[10px] text-muted-foreground px-1">+{dayItems.length - 3} more</p>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={showAdd} onOpenChange={(o) => {
                if (!o) {
                    setShowAdd(false);
                    setEditItem(null);
                }
            }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editItem ? "Edit Content" : `Add Content — ${selectedDate}`}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Title *</Label>
                            <Input value={form.title} onChange={(e) => setForm({...form, title: e.target.value})}
                                   placeholder="Content title..." autoFocus/>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <Label className="text-xs">Type</Label>
                                <select value={form.contentType}
                                        onChange={(e) => setForm({...form, contentType: e.target.value})}
                                        className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                                    {Object.keys(TYPE_EMOJI).map((t) => <option key={t} value={t}
                                                                                className="capitalize">{TYPE_EMOJI[t]} {t}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-xs">Status</Label>
                                <select value={form.status} onChange={(e) => setForm({...form, status: e.target.value})}
                                        className="w-full h-9 rounded-md border bg-background px-3 text-sm">
                                    {Object.keys(STATUS_COLORS).map((s) => <option key={s} value={s}
                                                                                   className="capitalize">{s}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Scheduled Date</Label>
                            <Input type="date" value={form.scheduledDate}
                                   onChange={(e) => setForm({...form, scheduledDate: e.target.value})}/>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Target Keyword</Label>
                            <Input value={form.targetKeyword}
                                   onChange={(e) => setForm({...form, targetKeyword: e.target.value})}
                                   placeholder="e.g. best SEO tools"/>
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Notes</Label>
                            <textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})}
                                      rows={2}
                                      className="w-full rounded-md border bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"/>
                        </div>
                    </div>
                    <DialogFooter>
                        {editItem && (
                            <Button variant="ghost" className="mr-auto text-destructive" onClick={() => {
                                handleDelete(editItem._id);
                                setShowAdd(false);
                                setEditItem(null);
                            }}>
                                <Trash2 className="h-4 w-4 mr-1.5"/> Delete
                            </Button>
                        )}
                        <Button variant="outline" onClick={() => {
                            setShowAdd(false);
                            setEditItem(null);
                        }}>Cancel</Button>
                        <Button variant="gradient" onClick={handleSave} isLoading={isSaving}>
                            {editItem ? "Save Changes" : "Add to Calendar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
