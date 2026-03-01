import { createSlice } from '@reduxjs/toolkit';
import { ITEMS } from '../../domain/seedData';
const initialState = {
    items: JSON.parse(JSON.stringify(ITEMS)),
};
const inventorySlice = createSlice({
    name: 'inventory',
    initialState,
    reducers: {
        updateQty(state, action) {
            const item = state.items.find((i) => i.sku === action.payload.sku);
            if (item)
                item.qty = Math.max(0, item.qty + action.payload.delta);
        },
        saveItem(state, action) {
            const idx = state.items.findIndex((i) => i.sku === action.payload.sku);
            if (idx !== -1)
                state.items[idx] = { ...state.items[idx], ...action.payload.edits };
        },
        deleteItem(state, action) {
            state.items = state.items.filter((i) => i.sku !== action.payload.sku);
        },
        createItem(state, action) {
            state.items.push({ ...action.payload, tags: action.payload.tags ?? [] });
        },
        receiveStock(state, action) {
            const item = state.items.find((i) => i.sku.toLowerCase() === action.payload.sku.toLowerCase());
            if (item)
                item.qty += action.payload.qty;
        },
    },
});
export const { updateQty, saveItem, deleteItem, createItem, receiveStock } = inventorySlice.actions;
export const inventoryReducer = inventorySlice.reducer;
