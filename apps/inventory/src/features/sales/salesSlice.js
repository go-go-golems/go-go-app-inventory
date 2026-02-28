import { createSlice } from '@reduxjs/toolkit';
import { SALES_LOG } from '../../domain/seedData';
const initialState = {
    log: JSON.parse(JSON.stringify(SALES_LOG)),
};
const salesSlice = createSlice({
    name: 'sales',
    initialState,
    reducers: {},
});
export const salesReducer = salesSlice.reducer;
