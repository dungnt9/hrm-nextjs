import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface AttendanceStatus {
  isCheckedIn: boolean;
  isCheckedOut: boolean;
  checkInTime: string | null;
  checkOutTime: string | null;
  currentHours: number;
}

interface AttendanceState {
  status: AttendanceStatus;
  isLoading: boolean;
}

const initialState: AttendanceState = {
  status: {
    isCheckedIn: false,
    isCheckedOut: false,
    checkInTime: null,
    checkOutTime: null,
    currentHours: 0,
  },
  isLoading: false,
};

const attendanceSlice = createSlice({
  name: "attendance",
  initialState,
  reducers: {
    setAttendanceStatus: (state, action: PayloadAction<AttendanceStatus>) => {
      state.status = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    checkIn: (state, action: PayloadAction<string>) => {
      state.status.isCheckedIn = true;
      state.status.checkInTime = action.payload;
    },
    checkOut: (
      state,
      action: PayloadAction<{ checkOutTime: string; totalHours: number }>
    ) => {
      state.status.isCheckedOut = true;
      state.status.checkOutTime = action.payload.checkOutTime;
      state.status.currentHours = action.payload.totalHours;
    },
  },
});

export const { setAttendanceStatus, setLoading, checkIn, checkOut } =
  attendanceSlice.actions;
export default attendanceSlice.reducer;
