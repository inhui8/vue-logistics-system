<template>
    <div class="load-appointment-container">
      <!-- Tab Buttons -->
      <div class="tabs">
        <button
          :class="['tab-button', { 'active': activeTab === 'calendar' }]"
          @click="activeTab = 'calendar'"
        >
          日历视图
        </button>
        <button
          :class="['tab-button', { 'active': activeTab === 'history' }]"
          @click="activeTab = 'history'"
        >
          历史记录
        </button>
      </div>

      <!-- Calendar View -->
      <div v-if="activeTab === 'calendar'" class="tab-content">
        <!-- Display Today's Counts -->
        <div class="today-counts">
          <span>今日预约统计：</span>
          <span>地板: {{ todayAppointmentCounts.floor }}</span>
          <span>卡板: {{ todayAppointmentCounts.pallet }}</span>
        </div>

        <FullCalendar :options="calendarOptions" ref="fullCalendar" />

        <!-- Use the new AppointmentModal component -->
        <AppointmentModal
          :visible="showModal"
          :current-appointment="currentAppointmentForModal"
          :edit-mode="editMode"
          :min-date="minDate"
          :available-time-slots="availableTimeSlots"
          :appointments="appointments"
          :appointment-settings="appointmentSettings"
          @save="handleModalSave"
          @update="handleModalUpdate"
          @delete="handleModalDelete"
          @close="closeAppointmentModal"
        />
      </div>

      <!-- History View -->
       <div v-if="activeTab === 'history'" class="tab-content">
         <ApptHistory />
      </div>

    </div>
</template>

<script>
import { ref, computed } from 'vue'; // Import ref for activeTab
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { v4 as uuidv4 } from 'uuid'; // Use UUID for unique IDs
import AppointmentModal from '@/components/AppointmentModal.vue'; // Import the modal component
import ApptHistory from './apptHistory.vue'; // Import the history component

export default {
    name: 'LoadAppointment',
    components: {
        FullCalendar,
        AppointmentModal,
        ApptHistory // Register the history component
    },
    setup() {
        // Using setup function for better composition API practice
        const activeTab = ref('calendar'); // Reactive state for active tab

        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD format

        const minDate = ref(todayStr); // Restrict past dates
        const showModal = ref(false);
        const editMode = ref(false);
        const fullCalendar = ref(null); // Ref for FullCalendar instance

        // --- Mock Appointments Data ---
        const appointments = ref([
           {
                id: uuidv4(),
                trainNumber: 'PC001',
                supplierName: 'Supplier A',
                appointmentDate: '2025-05-02',
                appointmentTime: '10:00:00',
                driverPhone: '1234567890',
                cargoType: '地板',
                loadType: 'liveload',
                 createdAt: new Date('2025-04-30'),
                 updatedAt: new Date('2025-05-01'), // Simulate update time
                 isCheckedIn: true,
                 isLoaded: true // Example: Loaded
            },
            // ... (keep other mock appointments as they were)
             {
                id: uuidv4(),
                trainNumber: 'PC002',
                supplierName: 'Supplier B',
                appointmentDate: '2025-05-03',
                appointmentTime: '14:00:00',
                driverPhone: '0987654321',
                cargoType: '卡板',
                loadType: 'drop',
                 createdAt: new Date('2025-05-01'),
                 updatedAt: new Date('2025-05-01'),
                 isCheckedIn: false,
                 isLoaded: false
            },
            {
                id: uuidv4(),
                trainNumber: 'PC003',
                supplierName: 'Supplier C',
                appointmentDate: '2025-05-02',
                appointmentTime: '11:00:00',
                driverPhone: '1122334455',
                cargoType: '地板',
                loadType: 'liveload',
                 createdAt: new Date('2025-05-01'),
                 updatedAt: new Date('2025-05-01'),
                 isCheckedIn: true, // Example: Only Checked In
                 isLoaded: false
            },
            {
                id: uuidv4(),
                trainNumber: 'PC004',
                supplierName: 'Supplier D',
                appointmentDate: '2025-05-06',
                appointmentTime: '09:00:00',
                driverPhone: '5566778899',
                cargoType: '卡板',
                loadType: 'liveload',
                 createdAt: new Date('2025-05-02'),
                 updatedAt: new Date('2025-05-02'),
                 isCheckedIn: true,
                 isLoaded: false // Example: Only Checked In
            },
            {
                id: uuidv4(),
                trainNumber: 'PC005',
                supplierName: 'Supplier A',
                appointmentDate: '2025-05-07',
                appointmentTime: '16:00:00',
                driverPhone: '1234567890',
                cargoType: '地板',
                loadType: 'drop',
                 createdAt: new Date('2025-05-03'),
                 updatedAt: new Date('2025-05-04'), // Simulate update
                 isCheckedIn: true,
                 isLoaded: true // Example: Loaded
            },
            {
                id: uuidv4(),
                trainNumber: 'PC006',
                supplierName: 'Supplier E',
                appointmentDate: '2025-05-02',
                appointmentTime: '08:00:00',
                driverPhone: '6677889900',
                cargoType: '卡板',
                loadType: 'liveload',
                 createdAt: new Date('2025-05-01'),
                 updatedAt: new Date('2025-05-01'),
                 isCheckedIn: false,
                 isLoaded: false
            },
            {
                id: uuidv4(),
                trainNumber: 'PC007',
                supplierName: 'Supplier B',
                appointmentDate: '2025-05-02',
                appointmentTime: '13:00:00',
                driverPhone: '0987654321',
                cargoType: '地板',
                loadType: 'drop',
                 createdAt: new Date('2025-05-01'),
                 updatedAt: new Date('2025-05-01'),
                 isCheckedIn: false,
                 isLoaded: false
            },
            {
                id: uuidv4(),
                trainNumber: 'PC008',
                supplierName: 'Supplier F',
                appointmentDate: '2025-05-02',
                appointmentTime: '15:00:00',
                driverPhone: '7788990011',
                cargoType: '卡板',
                loadType: 'drop',
                 createdAt: new Date('2025-05-01'),
                 updatedAt: new Date('2025-05-01'),
                 isCheckedIn: false,
                 isLoaded: false
            },
             {
                id: uuidv4(),
                trainNumber: 'PC009',
                supplierName: 'Supplier A',
                appointmentDate: '2025-05-02',
                appointmentTime: '17:00:00',
                driverPhone: '1234567890',
                cargoType: '地板',
                loadType: 'liveload',
                 createdAt: new Date('2025-05-01'),
                 updatedAt: new Date('2025-05-01'),
                 isCheckedIn: false,
                 isLoaded: false
            },
             {
                id: uuidv4(),
                trainNumber: 'PC010',
                supplierName: 'Supplier G',
                appointmentDate: '2025-05-02',
                appointmentTime: '19:00:00',
                driverPhone: '8899001122',
                cargoType: '卡板',
                loadType: 'liveload',
                 createdAt: new Date('2025-05-01'),
                 updatedAt: new Date('2025-05-01'),
                 isCheckedIn: false,
                 isLoaded: false
            },
            {
                id: uuidv4(),
                trainNumber: 'PC011',
                supplierName: 'Supplier H',
                appointmentDate: '2024-04-19', // Past date example
                appointmentTime: '14:30:00',
                driverPhone: '9900112233',
                cargoType: '地板',
                loadType: 'drop',
                 createdAt: new Date('2024-04-18'),
                 updatedAt: new Date('2024-04-18'),
                 isCheckedIn: true, // Example: Past and Checked In
                 isLoaded: false // But not loaded
            }
        ]);

        // --- Mock Appointment Settings ---
        const appointmentSettings = ref({
            '2025-05-02': { isOpen: true, timeSlots: { /* ... keep as before ... */ '08:00': { pallet: 5, floor: 2 }, '10:00': { pallet: 1, floor: 1 }, '11:00': { pallet: 3, floor: 3 }, '13:00': { pallet: 4, floor: 4 }, '14:00': { pallet: 4, floor: 4 }, '15:00': { pallet: 4, floor: 4 }, '17:00': { pallet: 4, floor: 4 }, '19:00': { pallet: 4, floor: 4 } } },
            '2025-05-03': { isOpen: true, timeSlots: { '14:00': { pallet: 2, floor: 2 } } },
            '2024-04-19': { isOpen: true, timeSlots: { '14:00': { pallet: 5, floor: 5 } } }, // Past date setting example
            '2025-05-06': { isOpen: true, timeSlots: { '09:00': { pallet: 3, floor: 3 } } },
            '2025-05-07': { isOpen: true, timeSlots: { '16:00': { pallet: 2, floor: 1 } } },
            // Other dates default to closed or have default capacity if needed
        });

        // --- Modal Data Helper ---
        const getInitialAppointmentData = () => ({ id: null, trainNumber: '', supplierName: '', appointmentDate: '', appointmentTime: '', driverPhone: '', cargoType: '', loadType: '', createdAt: null, updatedAt: null, isCheckedIn: false, isLoaded: false });
        const currentAppointmentForModal = ref(getInitialAppointmentData());

        // --- Time Slots ---
        const generateTimeSlots = () => {
            const slots = [];
            for (let i = 0; i < 24; i++) {
                const hour = String(i).padStart(2, '0');
                slots.push(`${hour}:00:00`);
            }
            return slots;
        };
        const availableTimeSlots = ref(generateTimeSlots());

        // --- Calculate Today's Appointment Counts ---
        const todayAppointmentCounts = computed(() => {
            const todayStr = new Date().toISOString().split('T')[0];
            let floorCount = 0;
            let palletCount = 0;

            appointments.value.forEach(app => {
                if (app.appointmentDate === todayStr) {
                    if (app.cargoType === '地板') {
                        floorCount++;
                    }
                     else if (app.cargoType === '卡板') {
                         palletCount++;
                    }
                }
            });

            return { floor: floorCount, pallet: palletCount };
        });

        // --- Calculate Daily Appointment Counts ---
        const dailyAppointmentCounts = computed(() => {
            const counts = {};
            appointments.value.forEach(app => {
                const date = app.appointmentDate;
                if (!counts[date]) {
                    counts[date] = { floor: 0, pallet: 0 };
                }
                if (app.cargoType === '地板') {
                    counts[date].floor++;
                }
                 else if (app.cargoType === '卡板') {
                    counts[date].pallet++;
                 }
            });
            return counts;
        });

        // --- Calendar Event Mapping ---
        const mapAppointmentsToEvents = () => {
            const todayCal = new Date();
            todayCal.setHours(0, 0, 0, 0);

            return appointments.value.map(app => {
                const dateParts = app.appointmentDate.split('-');
                const appointmentDateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2]));
                appointmentDateObj.setHours(0,0,0,0);
                const startDateTime = new Date(`${app.appointmentDate}T${app.appointmentTime}`);
                const endDateTime = new Date(startDateTime.getTime() + 60 * 60 * 1000); // Add 1 hour
                
                // --- Use ISOString directly for end time ---
                const eventEndString = endDateTime.toISOString();
                // --- End change ---

                const isPast = appointmentDateObj < todayCal;

                // Determine class names dynamically
                const classNames = [];
                if (isPast) {
                    classNames.push('past-event');
                }
                // Add status classes - Loaded takes precedence
                if (app.isLoaded) {
                    classNames.push('loaded-event');
                } else if (app.isCheckedIn) {
                    classNames.push('checked-in-event');
                }

                const eventObject = {
                    id: app.id,
                    title: `车次: ${app.trainNumber}, ${app.supplierName}`,
                    start: `${app.appointmentDate}T${app.appointmentTime}`, // Keep start as specific local time string if it works
                    // end: `${localEndDateStr}T${localEndTimeStr}`, // Old way
                    end: eventEndString, // New way using ISO string
                    allDay: false,
                    extendedProps: { ...app },
                    classNames: classNames,
                    editable: !isPast && !app.isCheckedIn && !app.isLoaded
                };
                return eventObject;
            });
        };

        // --- Calendar Options ---
        const calendarOptions = ref({
            plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin],
            height: 'auto',
            validRange: { start: todayStr },
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'timeGridDay,timeGridWeek,dayGridMonth,listWeek'
            },
            views: {
                listWeek: { type: 'listWeek', duration: { days: 365 }, buttonText: '列表' }
            },
            initialView: 'dayGridMonth',
            weekends: true,
            editable: true,
            selectable: true,
            events: mapAppointmentsToEvents(), // Initial load
            dayMaxEvents: 4,
            eventMaxStack: 4,
            dateClick: (clickInfo) => handleDateClick(clickInfo),
            eventClick: (clickInfo) => handleEventClick(clickInfo),
            eventDrop: (eventDropInfo) => handleEventDrop(eventDropInfo),
            eventContent: (arg) => renderEventContent(arg),
            select: (selectInfo) => handleDateSelect(selectInfo),
            eventDidMount: (info) => {
                const props = info.event.extendedProps;
                let statusText = '未登记';
                if (props.isLoaded) {
                    statusText = '已装车';
                } else if (props.isCheckedIn) {
                    statusText = '已登记';
                }
                const tooltipText = `车次号: ${props.trainNumber}\n` +
                                    `供应商: ${props.supplierName}\n` +
                                    `日期: ${props.appointmentDate}\n` +
                                    `时间: ${props.appointmentTime}\n` +
                                    `司机电话: ${props.driverPhone}\n` +
                                    `货物类型: ${props.cargoType}\n` +
                                    `装柜类型: ${props.loadType}\n` +
                                    `状态: ${statusText}`;
                info.el.setAttribute('title', tooltipText);
            },
            dayHeaderDidMount: (arg) => {
                // Apply only to non-month views (week, day)
                if (arg.view.type !== 'dayGridMonth') {
                    const dateStr = arg.date.toISOString().split('T')[0];
                    const counts = dailyAppointmentCounts.value[dateStr];
                    if (counts && (counts.floor > 0 || counts.pallet > 0)) {
                        const countsEl = document.createElement('span');
                        countsEl.classList.add('day-counts-header-indicator'); // Use specific class
                        countsEl.innerHTML = ` (地板:${counts.floor} 卡板:${counts.pallet})`; // Simplified text
                        const cushionEl = arg.el.querySelector('.fc-col-header-cell-cushion');
                        if (cushionEl) {
                            // Append after existing content
                            cushionEl.appendChild(countsEl);
                        }
                    }
                }
            },
            dayCellDidMount: (arg) => {
                 // Apply only to month view cells
                 if (arg.view.type === 'dayGridMonth') { 
                    const dateStr = arg.date.toISOString().split('T')[0];
                    const counts = dailyAppointmentCounts.value[dateStr];
                    if (counts && (counts.floor > 0 || counts.pallet > 0)) {
                        arg.el.style.position = 'relative';
                        arg.el.style.overflow = 'hidden';

                        const countsEl = document.createElement('div');
                        countsEl.classList.add('day-counts-cell-indicator'); // Use cell class
                        countsEl.innerHTML = `地板:${counts.floor} 卡板:${counts.pallet}`;
                        
                        arg.el.appendChild(countsEl);
                    }
                 }
            }
        });

        // --- Event Handlers ---
        const loadEvents = () => {
            calendarOptions.value.events = mapAppointmentsToEvents();
            // No need for nextTick/refetchEvents with local data usually
        };

        const handleDateSelect = (selectInfo) => {
            editMode.value = false;
            currentAppointmentForModal.value = {
                ...getInitialAppointmentData(),
                appointmentDate: selectInfo.startStr
            };
            showModal.value = true;
            const calendarApi = selectInfo.view.calendar;
            calendarApi.unselect();
        };

        const handleDateClick = (clickInfo) => {
            editMode.value = false;
            currentAppointmentForModal.value = {
                ...getInitialAppointmentData(),
                appointmentDate: clickInfo.dateStr
            };
            showModal.value = true;
        };

        const handleEventClick = (clickInfo) => {
            // Prevent editing past, checked-in, OR loaded events
            const isNonEditable = clickInfo.event.classNames.includes('past-event') || 
                                clickInfo.event.classNames.includes('checked-in-event') || 
                                clickInfo.event.classNames.includes('loaded-event');

            if (isNonEditable) {
                console.log("Clicked on a past, checked-in, or loaded event. Editing disabled.");
                alert('过去的预约、已登记或已装车的预约不能编辑。'); 
                return;
            }
            const clickedEvent = appointments.value.find(app => app.id === clickInfo.event.id);
            if (clickedEvent) {
                editMode.value = true;
                currentAppointmentForModal.value = { ...clickedEvent };
                showModal.value = true;
            }
        };

        const handleEventDrop = (eventDropInfo) => {
            const { event, oldEvent, revert } = eventDropInfo;
            const formatDateTime = (date) => date ? date.toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' }) : '未知时间';
            const oldStartTimeStr = formatDateTime(oldEvent.start);
            const newStartTimeStr = formatDateTime(event.start);

            if (confirm(`您确定要将预约从 ${oldStartTimeStr} 移动到 ${newStartTimeStr} 吗？`)) {
                const droppedAppointmentIndex = appointments.value.findIndex(app => app.id === event.id);
                if (droppedAppointmentIndex !== -1 && event.start) {
                    const startDate = new Date(event.start);
                    const appointmentDate = startDate.toISOString().split('T')[0];
                    const appointmentTime = startDate.toLocaleTimeString('en-GB', { hour12: false });

                    appointments.value[droppedAppointmentIndex].appointmentDate = appointmentDate;
                    appointments.value[droppedAppointmentIndex].appointmentTime = appointmentTime;
                     appointments.value[droppedAppointmentIndex].updatedAt = new Date(); // Update timestamp

                    console.log("Event drop confirmed, updated appointment:", appointments.value[droppedAppointmentIndex]);
                    loadEvents();
                } else {
                    console.error("Could not find appointment or event start time after drop confirmation:", event.id);
                    alert("更新预约时间失败，请重试！");
                    revert();
                }
            } else {
                console.log("Event drop canceled by user.");
                revert();
            }
        };

        const renderEventContent = (arg) => {
            const props = arg.event.extendedProps;
            const formatTime = (date) => date ? date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }) : '';
            const startTime = formatTime(arg.event.start);
            const endTime = formatTime(arg.event.end);
            const supplierDisplay = props.supplierName || '';
            
            // Determine status text: Loaded > CheckedIn > (None)
            let statusText = '';
            if (props.isLoaded) {
                statusText = ' <span style="font-style: italic; opacity: 0.9; font-weight: bold; color: #721c24;">(已装车)</span>'; // Use darker red for text
            } else if (props.isCheckedIn) {
                statusText = ' <span style="font-style: italic; opacity: 0.85; font-weight: bold; color: #155724;">(已登记)</span>'; // Use darker green for text
            }

            return {
                html: `
                    <div class="fc-event-main-custom">
                        <span class="event-time">${startTime} - ${endTime}</span>
                        <span class="event-details">车次: ${props.trainNumber}, ${supplierDisplay}${statusText}</span>
                         <div class="event-extra-details">
                            货物类型: ${props.cargoType}/${props.loadType} 电话: ${props.driverPhone}
                         </div>
                    </div>
                `
            };
        };

        const closeAppointmentModal = () => {
            showModal.value = false;
        };

        const handleModalSave = (newAppointmentData) => {
            const now = new Date();
            const newAppointment = {
                ...newAppointmentData,
                id: uuidv4(),
                createdAt: now,
                updatedAt: now,
                isCheckedIn: false, // Default status
                isLoaded: false // Default status
            };
            appointments.value.push(newAppointment);
            console.log("Appointment saved (from modal):", newAppointment);
            loadEvents();
            closeAppointmentModal();
        };

        const handleModalUpdate = (updatedAppointmentData) => {
            const index = appointments.value.findIndex(app => app.id === updatedAppointmentData.id);
            if (index !== -1) {
                 const now = new Date();
                 appointments.value.splice(index, 1, { ...updatedAppointmentData, updatedAt: now });
                console.log("Appointment updated (from modal):", updatedAppointmentData);
                loadEvents();
                closeAppointmentModal();
            } else {
                console.error("Could not find appointment to update (from modal):", updatedAppointmentData.id);
                alert("更新失败，未找到预约记录！");
            }
        };

        const handleModalDelete = (appointmentId) => {
            const index = appointments.value.findIndex(app => app.id === appointmentId);
            if (index !== -1) {
                appointments.value.splice(index, 1);
                console.log("Appointment deleted (from modal):", appointmentId);
                loadEvents();
                closeAppointmentModal();
            } else {
                console.error("Could not find appointment to delete (from modal):", appointmentId);
                alert("删除失败，未找到预约记录！");
            }
        };

        // Return reactive state and methods
        return {
            activeTab,
            minDate,
            appointments,
            appointmentSettings,
            calendarOptions,
            showModal,
            currentAppointmentForModal,
            editMode,
            availableTimeSlots,
            fullCalendar, // Expose ref if needed
            handleDateClick,
            handleEventClick,
            handleEventDrop,
            renderEventContent,
            handleDateSelect,
            todayAppointmentCounts, // Expose the computed property
            closeAppointmentModal,
            handleModalSave,
            handleModalUpdate,
            handleModalDelete
            // loadEvents is called internally, maybe no need to expose
        };
    }
    // Removed mounted hook (event loading now handled in setup)
    // Removed methods block (all methods moved into setup)
};
</script>

<style scoped>
.load-appointment-container {
  padding: 15px;
}

.tabs {
  margin-bottom: 15px;
  border-bottom: 2px solid #eee;
}

.tab-button {
  padding: 10px 20px;
  margin-right: 5px;
  margin-bottom: -2px; /* Overlap border */
  border: none;
  background-color: transparent;
  cursor: pointer;
  font-size: 1rem;
  color: #6c757d;
  border-bottom: 2px solid transparent; /* Placeholder for active border */
  transition: color 0.2s ease, border-color 0.2s ease;
}

.tab-button.active {
  color: #007bff;
  border-bottom-color: #007bff;
  font-weight: bold;
}

.tab-button:hover:not(.active) {
  color: #343a40;
}

.tab-content {
  /* padding-top: 15px; */
}

/* REMOVED General Event Background Color rules */

/* --- Custom Event Styling (Inner content) - Reverted --- */
:deep(.fc-event-main-custom) {
    display: flex;
    flex-direction: column;
    overflow: hidden; /* Re-add overflow */
    font-size: 0.85em;
    line-height: 1.3; /* Revert line height */
    padding: 2px 4px; /* Revert padding */
    /* Removed height, box-sizing */
}

:deep(.event-time) {
    font-weight: bold;
    margin-right: 5px;
    /* Removed flex-shrink */
}

:deep(.event-details) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-bottom: 2px; /* Revert margin */
    /* Removed flex-shrink */
}

:deep(.event-extra-details) {
    font-size: 0.9em;
    color: #eee; /* Revert color */
    white-space: nowrap; /* Revert wrapping */
    overflow: hidden; /* Revert overflow */
    text-overflow: ellipsis; /* Revert text-overflow */
    opacity: 0.8; /* Revert opacity */
    margin-top: 2px; /* Revert margin */
    /* Removed display: block, line-height, flex-shrink, min-height */
}

/* REMOVED forceful display rule for timeGrid events */

/* Hide extra details in month view (Keep this) */
:deep(.fc-daygrid-event .event-extra-details) {
    display: none !important; /* Keep forceful hide for month view */
}
:deep(.fc-daygrid-event .fc-event-main-custom) {
    padding: 1px 3px;
    font-size: 0.8em;
}

/* --- List View Text Color (Reverted where necessary) --- */
:deep(.fc-list-event td) { color: #444; }
:deep(.fc-list-event-title a) { color: #2c3e50 !important; font-weight: 500; }
:deep(.fc-list-event-time) { color: #555; }
:deep(.fc-list-event .event-extra-details) {
    /* Revert to darker color specifically for list view */
    color: #666 !important; 
    font-size: 0.85em;
    margin-top: 3px;
    display: block !important; /* Ensure shown in list */
    opacity: 1; /* Ensure full opacity in list */
}

/* --- Style for Past Events (Reverted) --- */
:deep(.fc-event.past-event) {
    opacity: 0.65;
    border-color: #adb5bd !important;
    cursor: default !important;
    /* Let background be default blue, faded by opacity */
}
/* Text inside past events needs specific color due to opacity */
:deep(.fc-event.past-event .fc-event-main-custom),
:deep(.fc-event.past-event .event-time),
:deep(.fc-event.past-event .event-details) {
    color: #495057 !important;
}
:deep(.fc-event.past-event .event-extra-details) {
    color: #6c757d !important;
    opacity: 0.7 !important; /* Revert opacity adjustment, let parent opacity handle more */
}
/* Past events in List View */
:deep(.fc-list-event.past-event) {
    opacity: 0.65;
}
:deep(.fc-list-event.past-event td) { color: #495057 !important; }
:deep(.fc-list-event.past-event .fc-list-event-title a) { color: #495057 !important; font-weight: normal !important; }
:deep(.fc-list-event.past-event .fc-list-event-time) { color: #495057 !important; }
:deep(.fc-list-event.past-event .event-extra-details) { 
    color: #6c757d !important; 
    /* Opacity is handled by the parent event's opacity */
}

/* --- Responsive Styles (keep as before) --- */
@media (max-width: 768px) {
    :deep(.fc-header-toolbar) { flex-direction: column; gap: 10px; }
    :deep(.fc-toolbar-chunk) { display: flex; justify-content: center; flex-wrap: wrap; gap: 5px; }
    :deep(.fc-event-title) { font-size: 0.85em; }
    .tab-button { padding: 8px 12px; font-size: 0.9rem; }
}

/* REMOVED Settings Styles */
/* REMOVED Modal Styles (they are now in AppointmentModal.vue) */

/* --- Loaded Event Styling --- */
/* Apply to loaded but not past events */
:deep(.fc-event.loaded-event:not(.past-event)) {
    background-color: #f8d7da; /* Bootstrap danger light red */
    border-color: #f5c6cb;
}

/* Text color for loaded events (ensure contrast) */
 :deep(.fc-event.loaded-event:not(.past-event) .fc-event-main-custom),
 :deep(.fc-event.loaded-event:not(.past-event) .event-time),
 :deep(.fc-event.loaded-event:not(.past-event) .event-details),
 :deep(.fc-event.loaded-event:not(.past-event) .event-extra-details) {
     color: #721c24 !important; /* Bootstrap danger dark red text */
 }
 /* Adjust extra details color slightly if needed (using same dark red for now) */
 :deep(.fc-event.loaded-event:not(.past-event) .event-extra-details) {
     color: #8c2d36 !important; 
 }

 /* Ensure list view loaded events also get the right colors */
 :deep(.fc-list-event.loaded-event:not(.past-event)) {
    background-color: #f8d7da !important; 
 }
  :deep(.fc-list-event.loaded-event:not(.past-event) td) {
     color: #721c24 !important;
  }
 :deep(.fc-list-event.loaded-event:not(.past-event) .fc-list-event-title a) {
      color: #721c24 !important;
 }
 :deep(.fc-list-event.loaded-event:not(.past-event) .fc-list-event-time) {
      color: #721c24 !important;
 }
 :deep(.fc-list-event.loaded-event:not(.past-event) .event-extra-details) {
     color: #8c2d36 !important;
 }

/* --- Checked-in Event Styling (comes AFTER loaded rules, but less specific selector) --- */
/* Only apply if NOT loaded */
:deep(.fc-event.checked-in-event:not(.loaded-event):not(.past-event)) {
    background-color: #d4edda;
    border-color: #c3e6cb;
}
:deep(.fc-event.checked-in-event:not(.loaded-event):not(.past-event) .fc-event-main-custom),
:deep(.fc-event.checked-in-event:not(.loaded-event):not(.past-event) .event-time),
:deep(.fc-event.checked-in-event:not(.loaded-event):not(.past-event) .event-details),
:deep(.fc-event.checked-in-event:not(.loaded-event):not(.past-event) .event-extra-details) {
     color: #155724 !important;
 }
:deep(.fc-event.checked-in-event:not(.loaded-event):not(.past-event) .event-extra-details) {
     color: #1d7a33 !important; 
 }
/* List view - only apply if NOT loaded */
 :deep(.fc-list-event.checked-in-event:not(.loaded-event):not(.past-event)) {
    background-color: #d4edda !important; 
 }
 :deep(.fc-list-event.checked-in-event:not(.loaded-event):not(.past-event) td) {
     color: #155724 !important;
  }
 :deep(.fc-list-event.checked-in-event:not(.loaded-event):not(.past-event) .fc-list-event-title a) {
      color: #155724 !important;
 }
 :deep(.fc-list-event.checked-in-event:not(.loaded-event):not(.past-event) .fc-list-event-time) {
      color: #155724 !important;
 }
 :deep(.fc-list-event.checked-in-event:not(.loaded-event):not(.past-event) .event-extra-details) {
     color: #1d7a33 !important;
 }

/* --- Style for Past Events (ensure opacity overrides other backgrounds) --- */
:deep(.fc-event.past-event) {
    opacity: 0.65 !important; /* Force opacity */
    border-color: #adb5bd !important;
    cursor: default !important; /* Force cursor */
    /* Background color will be loaded-red or checked-in-green if applicable, but faded by opacity */
}
/* Text inside past events needs specific color due to opacity */
:deep(.fc-event.past-event .fc-event-main-custom),
:deep(.fc-event.past-event .event-time),
:deep(.fc-event.past-event .event-details) {
    color: #495057 !important;
}
:deep(.fc-event.past-event .event-extra-details) {
    color: #6c757d !important;
    opacity: 0.7 !important;
}
/* Past events in List View */
:deep(.fc-list-event.past-event) {
    opacity: 0.65 !important; /* Force opacity */
}
/* Specific text colors for past list items */
:deep(.fc-list-event.past-event td) { color: #495057 !important; }
:deep(.fc-list-event.past-event .fc-list-event-title a) { color: #495057 !important; font-weight: normal !important; }
:deep(.fc-list-event.past-event .fc-list-event-time) { color: #495057 !important; }
:deep(.fc-list-event.past-event .event-extra-details) { color: #6c757d !important; }

/* Style for today's counts display */
.today-counts {
  padding: 10px 15px;
  margin-bottom: 15px;
  background-color: #f8f9fa; /* Light background */
  border: 1px solid #dee2e6;
  border-radius: 4px;
  font-size: 0.95rem;
  color: #495057;
  display: flex;
  gap: 20px; /* Spacing between items */
}

.today-counts span {
  font-weight: 500;
}

/* Style for counts indicator within day headers (week/day view) */
:deep(.day-counts-header-indicator) {
    font-size: 0.8em;
    color: #6c757d;
    font-weight: normal;
    margin-left: 4px;
    white-space: nowrap; /* Prevent wrapping */
}

/* Style for counts indicator within day cells (month view) - Renamed class */
:deep(.day-counts-cell-indicator) {
    position: absolute;
    top: 1px;    
    left: 2px;   
    font-size: 0.65em; 
    background-color: rgba(230, 230, 230, 0.85);
    padding: 1px 3px; 
    border-radius: 3px;
    color: #333;
    font-weight: normal;
    z-index: 10; 
    line-height: 1.2; 
    white-space: nowrap; /* Keep nowrap for single line */
    text-align: left;
    border: 1px solid rgba(200, 200, 200, 0.8);
}

</style>
