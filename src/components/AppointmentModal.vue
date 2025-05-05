<template>
  <div v-if="visible" class="modal">
    <div class="modal-content">
      <h2 v-if="editMode">编辑预约信息</h2>
      <h2 v-else>创建预约信息</h2>

      <!-- Form fields bind to localAppointment -->
      <div class="form-group">
        <label for="trainNumber">车次号:<span class="required">*</span></label>
        <input type="text" id="trainNumber" v-model="localAppointment.trainNumber" placeholder="输入车次号" required />
      </div>
      <div class="form-group">
        <label for="supplierName">供应商名称：<span class="required">*</span></label>
        <input type="text" v-model="localAppointment.supplierName" placeholder="输入供应商名称" required />
      </div>
      <div class="form-group">
        <label for="appointmentDate">预约日期：<span class="required">*</span></label>
        <input type="date" v-model="localAppointment.appointmentDate" required :min="minDate" />
      </div>
      <div class="form-group">
        <label for="appointmentTime">预约时间段：<span class="required">*</span></label>
        <select v-model="localAppointment.appointmentTime" required>
          <option disabled value="">请选择时间</option>
          <option v-for="time in availableTimeSlots" :key="time" :value="time">{{ time }}</option>
        </select>
      </div>

      <!-- Display remaining slots -->
      <div class="form-group remaining-slots-info" v-if="localAppointment.appointmentDate && localAppointment.appointmentTime">
         <span v-if="remainingSlots.isOpen">
           当前时间段剩余可预约:
           <span class="slot-count">卡板 {{ remainingSlots.pallet }}</span> /
           <span class="slot-count">地板 {{ remainingSlots.floor }}</span>
         </span>
         <span v-else class="closed-info">
            该日期或时间段当前不开放预约
         </span>
      </div>

      <div class="form-group">
        <label for="driverPhone">司机电话<span class="required">*</span></label>
        <input type="tel" v-model="localAppointment.driverPhone" placeholder="输入司机电话" required />
      </div>
      <div class="form-group">
        <label for="cargoType">货物类型：<span class="required">*</span></label>
        <select v-model="localAppointment.cargoType" required>
          <option disabled value="">请选择货物类型</option>
          <option value="地板">地板</option>
          <option value="卡板">卡板</option>
        </select>
      </div>
      <div class="form-group">
        <label for="loadType">装柜类型：<span class="required">*</span></label>
        <select v-model="localAppointment.loadType" required>
          <option disabled value="">请选择装柜类型</option>
          <option value="liveload">Liveload</option>
          <option value="drop">Drop</option>
        </select>
      </div>

      <div class="form-actions">
        <button class="btn-save" @click="saveOrUpdate">保存</button>
        <button class="btn-delete" @click="deleteAppointment" v-if="editMode">删除</button>
        <button class="btn-cancel" @click="close">取消</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppointmentModal',
  props: {
    visible: {
      type: Boolean,
      required: true
    },
    currentAppointment: {
      type: Object,
      required: true
    },
    editMode: {
      type: Boolean,
      required: true
    },
    minDate: {
      type: String,
      required: true
    },
    availableTimeSlots: {
      type: Array,
      required: true
    },
    appointments: {
        type: Array,
        required: true
    },
    appointmentSettings: {
        type: Object,
        required: true
    }
  },
  emits: ['save', 'update', 'delete', 'close'],
  data() {
    return {
      localAppointment: {} // Initialize as empty, watcher will populate
    };
  },
  computed: {
    remainingSlots() {
      const date = this.localAppointment.appointmentDate;
      const time = this.localAppointment.appointmentTime;

      if (!date || !time) {
        return { pallet: '-', floor: '-' };
      }
      const timeSlotKey = time.substring(0, 2) + ':00';
      const daySettings = this.appointmentSettings[date] || { isOpen: false, timeSlots: {} };
      const dateIsOpen = daySettings.isOpen;
      const maxCapacity = daySettings.timeSlots[timeSlotKey] || { pallet: 0, floor: 0 };
      const maxPallet = dateIsOpen ? (maxCapacity.pallet || 0) : 0;
      const maxFloor = dateIsOpen ? (maxCapacity.floor || 0) : 0;

      let currentPalletCount = 0;
      let currentFloorCount = 0;
      this.appointments.forEach(app => {
        if (app.appointmentDate === date && app.appointmentTime === time && !(this.editMode && app.id === this.localAppointment.id)) {
          if (app.cargoType === '卡板') currentPalletCount++;
          else if (app.cargoType === '地板') currentFloorCount++;
        }
      });

      const remainingPallet = Math.max(0, maxPallet - currentPalletCount);
      const remainingFloor = Math.max(0, maxFloor - currentFloorCount);

      if (!dateIsOpen) {
        return { pallet: 0, floor: 0, isOpen: false };
      }
      return { pallet: remainingPallet, floor: remainingFloor, isOpen: true };
    }
  },
  watch: {
    currentAppointment: {
      handler(newValue) {
        this.localAppointment = JSON.parse(JSON.stringify(newValue || {})); // Handle potential null/undefined
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    validateForm() {
      const app = this.localAppointment;
      return (
        app.trainNumber &&
        app.supplierName &&
        app.appointmentDate &&
        app.appointmentTime &&
        app.driverPhone &&
        app.cargoType &&
        app.loadType
      );
    },
    saveOrUpdate() {
      if (!this.validateForm()) {
        alert("所有字段都是必填的！");
        return;
      }
      if (!this.remainingSlots.isOpen) {
        alert('该日期或时间段当前不开放预约');
        return;
      }
      if (this.localAppointment.cargoType === '卡板' && this.remainingSlots.pallet <= 0) {
          alert('当前时间段卡板预约已满！');
          return;
      }
       if (this.localAppointment.cargoType === '地板' && this.remainingSlots.floor <= 0) {
          alert('当前时间段地板预约已满！');
          return;
      }

      if (this.editMode) {
        this.$emit('update', { ...this.localAppointment });
      } else {
        this.$emit('save', { ...this.localAppointment });
      }
    },
    deleteAppointment() {
      this.$emit('delete', this.localAppointment.id);
    },
    close() {
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
/* --- Styles moved from appointment.vue --- */
.modal {
    display: flex;
    justify-content: center;
    align-items: center;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 1050;
}
.modal-content {
    background-color: white;
    padding: 30px;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
    max-height: 90vh;
    overflow-y: auto;
}
h2 {
    margin-top: 0;
    margin-bottom: 25px;
    text-align: center;
    color: #333;
}
.form-group {
    margin-bottom: 18px;
}
.form-group label {
    display: block;
    margin-bottom: 6px;
    font-weight: bold;
    color: #555;
}
.form-group .required {
    color: red;
    margin-left: 4px;
}
.form-group input,
.form-group select {
     width: 100%;
    padding: 10px;
    font-size: 1rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    box-sizing: border-box;
}
.form-actions {
    display: flex;
    justify-content: space-between;
    gap: 10px;
    margin-top: 25px;
    border-top: 1px solid #eee;
    padding-top: 20px;
}
.btn-save,
.btn-cancel,
.btn-delete {
     flex-grow: 1;
    padding: 12px 20px;
    font-size: 1rem;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    transition: background-color 0.2s ease;
}
.btn-save { background-color: #28a745; color: white; }
.btn-save:hover { background-color: #218838; }
.btn-delete { background-color: #dc3545; color: white; }
.btn-delete:hover { background-color: #c82333; }
.btn-cancel { background-color: #6c757d; color: white; }
.btn-cancel:hover { background-color: #5a6268; }

/* Styles for remaining slots info */
.remaining-slots-info {
    font-size: 0.9em;
    padding: 8px 12px;
    background-color: #e9ecef;
    border-radius: 4px;
    margin-top: -5px;
    margin-bottom: 15px;
    text-align: center;
}
.remaining-slots-info .slot-count { font-weight: bold; margin: 0 5px; }
.remaining-slots-info .closed-info { color: #dc3545; font-weight: bold; }
</style> 