<template>
  <div class="appointment-form">
    <h2>预约设置</h2>

    <!-- Single Date Selector (Default View) -->
    <div class="form-group" v-if="!isBatchMode">
      <label for="appointmentDate">选择日期：</label>
      <input type="date" v-model="appointmentDate" @change="loadSettings" />
      <br /><br />
      <button @click="switchToBatchMode">切换到批量设置</button>
    </div>

    <!-- Batch Date Selector (Activated View) -->
    <div class="form-group" v-if="isBatchMode">
      <label for="batchStartDate">批量设置开始日期：</label>
      <input type="date" v-model="batchStartDate" />
      <label for="batchEndDate">批量设置结束日期：</label>
      <input type="date" v-model="batchEndDate" />
      <br /><br />
      <!-- <button @click="enableBatchMode">启用批量设置</button> Removed redundant enable button -->
      <button @click="disableBatchMode">取消批量设置</button>
    </div>

    <!-- Advance Booking Time Setting -->
    <div class="form-group">
      <label for="advanceBookingValue">最多可提前预约时间：</label>
      <input type="number" v-model.number="advanceBookingValue" min="0" style="width: 80px; margin-right: 5px;" />
      <select v-model="advanceBookingUnit" style="padding: 5px;">
        <option value="hours">小时</option>
        <option value="days">天</option>
      </select>
    </div>

    <!-- 设置每个时间段的最大预约数量 -->
    <h3>设置时间段的最大预约数量 ({{ isBatchMode ? batchDateRange : (appointmentDate || '请选择日期') }})</h3>
    <div class="time-slot-container">
      <div v-for="time in timeSlots" :key="time" class="time-slot">
        <h4>{{ time }}</h4>
        <div class="input-row">
          <label :for="time + '-pallet'">卡板</label>
          <input type="number" v-model="maxAppointments[time].pallet" placeholder="卡板预约数" min="0" class="input-field" />
          <label :for="time + '-floor'">地板</label>
          <input type="number" v-model="maxAppointments[time].floor" placeholder="地板预约数" min="0" class="input-field" />
        </div>
      </div>
    </div>

    <!-- 是否开放当天预约 -->
    <div class="form-group">
      <label for="isOpen">该{{ isBatchMode ? '选定时间段' : '日期' }}是否开放预约：</label>
      <input type="checkbox" v-model="isOpen" />
    </div>

    <!-- 保存按钮 -->
    <button @click="saveSettings">保存设置</button>
  </div>
</template>

<script>
// Note: API calls removed as per previous steps for frontend-only simulation
// import { saveAppointmentSettings, getAppointmentSettings } from '@/api/appointment/appointment';

export default {
  name: 'ApptSet', // Changed name
  data() {
     // Initialize time slots structure
    const initialTimeSlotsData = {};
    const timeSlots = [
        '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
    ];
    timeSlots.forEach(time => {
        initialTimeSlotsData[time] = { pallet: 0, floor: 0 };
    });

    return {
      // Local storage for settings in this component
      appointmentSettings: {},
      appointmentDate: '',
      batchStartDate: '',
      batchEndDate: '',
      isBatchMode: false,
      timeSlots: timeSlots,
      // Use a function to ensure deep copy for reset
      maxAppointments: JSON.parse(JSON.stringify(initialTimeSlotsData)),
      isOpen: true,
      initialTimeSlotsData: JSON.parse(JSON.stringify(initialTimeSlotsData)), // Store initial state for reset
      // Advance Booking Settings
      advanceBookingValue: 24, // Default value
      advanceBookingUnit: 'hours' // Default unit ('hours' or 'days')
    };
  },
  computed: { // Added computed property for dynamic title
    batchDateRange() {
      if (this.batchStartDate && this.batchEndDate) {
        return `${this.batchStartDate} 至 ${this.batchEndDate}`;
      }
      return '请选择日期范围';
    }
  },
  methods: {
    switchToBatchMode() {
        // No need to check dates here, just switch the mode
        this.isBatchMode = true;
        this.appointmentDate = ''; // Clear single date selection
        this.resetSettingsForm(); // Reset form data when switching modes
    },
    // Renamed from enableBatchMode to validateBatchDates for clarity
    validateBatchDates() {
      if (this.batchStartDate && this.batchEndDate) {
         if (new Date(this.batchStartDate) > new Date(this.batchEndDate)) {
            alert('开始日期不能晚于结束日期！');
            return false; // Validation failed
         }
         return true; // Validation passed
      } else {
        alert('请先选择批量设置的开始日期和结束日期！');
        return false; // Validation failed
      }
    },
    disableBatchMode() {
      this.isBatchMode = false;
      this.batchStartDate = ''; // Clear batch dates
      this.batchEndDate = '';
      this.resetSettingsForm(); // Reset form data
      // Optional: Load settings if a single date was previously selected and you want to restore its view
      // if (this.appointmentDate) this.loadSettings();
    },
    loadSettings() {
      // Load from local mock data (appointmentSettings)
      const date = this.appointmentDate;
      if (!date) {
          this.resetSettingsForm();
          return;
      }

      const settingsForDate = this.appointmentSettings[date];

      if (settingsForDate) {
        this.isOpen = settingsForDate.isOpen;
        this.timeSlots.forEach(time => {
            const slotData = settingsForDate.timeSlots[time];
            this.maxAppointments[time] = {
                pallet: slotData?.pallet || 0,
                floor: slotData?.floor || 0
            };
        });
        console.log(`Loaded settings for ${date}:`, JSON.parse(JSON.stringify(settingsForDate)));
      } else {
        this.resetSettingsForm();
        console.log(`No settings found for ${date}, using defaults.`);
      }
    },
    saveSettings() {
      // Save to local mock data (appointmentSettings)
      if (this.isBatchMode) {
        // Validate dates before saving
        if (!this.validateBatchDates()) {
            return; // Stop if validation fails
        }

        const startDate = new Date(this.batchStartDate);
        const endDate = new Date(this.batchEndDate);
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
          const formattedDate = currentDate.toISOString().split('T')[0];
          this.appointmentSettings[formattedDate] = {
            isOpen: this.isOpen,
            timeSlots: JSON.parse(JSON.stringify(this.maxAppointments))
          };
          console.log(`Saved batch settings for ${formattedDate}`);
          currentDate.setDate(currentDate.getDate() + 1);
        }
        alert('批量设置已保存！');
        this.disableBatchMode(); // Switch back to single mode after successful batch save

      } else {
        if (!this.appointmentDate) {
          alert('请先选择要保存设置的日期！');
          return;
        }
        const date = this.appointmentDate;
        this.appointmentSettings[date] = {
          isOpen: this.isOpen,
          timeSlots: JSON.parse(JSON.stringify(this.maxAppointments))
        };
         console.log(`Saved settings for ${date}:`, JSON.parse(JSON.stringify(this.appointmentSettings[date])));
        alert(`日期 ${date} 的设置已保存！`);
      }
       console.log("Current all settings:", this.appointmentSettings);
       console.log(`Advance Booking Setting: ${this.advanceBookingValue} ${this.advanceBookingUnit}`); // Log the advance setting
       // In a real app, you'd likely emit an event or use a store to update shared state
    },
    resetSettingsForm() {
        this.isOpen = true;
        this.maxAppointments = JSON.parse(JSON.stringify(this.initialTimeSlotsData));
    }
  }
};
</script>

<style scoped>
/* Styles moved from appointment.vue */
.appointment-form {
  max-width: 800px;
  margin: auto;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}
.form-group {
  margin-bottom: 20px;
}
.form-group label { /* Added label style */
    display: inline-block; /* Adjust display */
    margin-right: 10px; /* Add some space */
    margin-bottom: 6px;
    font-weight: bold;
    color: #555;
}
.form-group input[type="date"], /* Specific inputs */
.form-group input[type="checkbox"] {
    margin-right: 15px; /* Space between inputs/labels */
}

.time-slot-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}
.time-slot {
  background-color: #ffffff;
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
.time-slot h4 {
  margin-top: 0;
  margin-bottom: 10px;
  font-size: 16px;
  color: #333;
}
.input-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.input-row label {
  font-size: 14px;
  color: #555;
  flex: 1;
}
.input-field {
  flex: 2;
  padding: 5px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  max-width: 80px;
}
button { /* General button style */
  padding: 10px 20px;
  background-color: #28a745;
  color: white;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  font-size: 16px;
  margin-top: 10px;
  margin-right: 10px;
}
button:hover {
  background-color: #218838;
}
/* Style for cancel batch button */
button:last-of-type { /* More specific selector might be needed if more buttons are added */
     background-color: #6c757d;
}
button:last-of-type:hover {
     background-color: #5a6268;
}
</style> 