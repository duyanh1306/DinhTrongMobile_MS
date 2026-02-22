const Store = require("../models/Store");

const createStore = async (req, res) => {
  try {
    const { code, name, location } = req.body;
    const newStore = new Store({ code, name, location });
    const savedStore = await newStore.save();
    res.status(201).json(savedStore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getAllStores = async (req, res) => {
  try {
    const stores = await Store.find();
    res.status(200).json(stores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getStoreById = async (req, res) => {
  try {
    const store = await Store.findById(req.params.id);
    if (!store) return res.status(404).json({ message: "Store not found" });
    res.status(200).json(store);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateStore = async (req, res) => {
  try {
    const updatedStore = await Store.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!updatedStore) return res.status(404).json({ message: "Store not found" });
    res.status(200).json(updatedStore);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteStore = async (req, res) => {
  try {
    const deletedStore = await Store.findByIdAndDelete(req.params.id);
    if (!deletedStore) return res.status(404).json({ message: "Store not found" });
    res.status(200).json({ message: "Store deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createStore,
  getAllStores,
  getStoreById,
  updateStore,
  deleteStore,
};