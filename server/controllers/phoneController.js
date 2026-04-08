const Phone = require("../models/Phone");
const Item = require("../models/Item");
const QRCode = require('qrcode');
const InventoryTransaction = require("../models/Inventory_transaction");
const InventoryTransactionDetail = require("../models/Inventory_transaction_detail"); // <--- THÊM DÒNG NÀY

const generatePhoneQRCode = async (req, res) => {
    try {
        const { id } = req.params;
        const phone = await Phone.findById(id);

        if (!phone) return res.status(404).json({ success: false, message: "Phone not found" });

        const qrText = phone.serialCode;
        const qrCodeImage = await QRCode.toBuffer(qrText, {
            type: 'png', width: 200, margin: 1, color: { dark: '#000000', light: '#FFFFFF' }
        });

        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', 'inline; filename=qrcode.png');
        res.status(200).send(qrCodeImage);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPhonesPaginatedAndSearch = async (req, res) => {
    try {
        const { search = '', status, storeId } = req.query;
        let query = {};

        if (search) query.serialCode = { $regex: search, $options: 'i' };
        if (status) query.status = status;
        if (storeId) query.storeId = storeId;

        const phones = await Phone.find(query)
            .populate({ path: 'phoneModelId', populate: { path: 'brand', select: 'name' } })
            .populate('storeId', 'name address')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, data: phones });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};

// 🌟 ĐÃ SỬA LOGIC GHI LOG HEADER-DETAIL KHI TECH ĐƯA RA QUYẾT ĐỊNH
const handleTechDecision = async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, sellingPrice, capacity, colorName, parts, phoneName, replacedItems } = req.body;

    const phone = await Phone.findById(id);
    if (!phone) return res.status(404).json({ message: "Không tìm thấy điện thoại" });

    // 1. LUỒNG NHẬP KHO NGAY (Không sửa chữa)
    if (decision === "DIRECT_IMPORT") {
      phone.status = "in_stock";
      await phone.save();

      const header = await InventoryTransaction.create({
        storeId: phone.storeId,
        transactionType: "INBOUND",
        referenceType: "TRADE_IN_IMPORT",
        referenceId: phone._id,
        totalItems: 1,
        note: `Nhập kho nguyên bản máy thu cũ: ${phoneName || phone._id.toString().slice(-6)}`
      });

      await InventoryTransactionDetail.create({
        transactionId: header._id,
        phoneId: phone._id,
        quantity: 1,
        note: "Nhập nguyên bản"
      });

      return res.status(200).json({ message: "Đã nhập kho nguyên bản" });
    }

    // 2. LUỒNG TÂN TRANG / SỬA BÁN
    if (decision === "SELL") {
      phone.status = "in_stock";
      phone.sellingPrice = Number(sellingPrice);
      if (capacity) phone.capacity = capacity;
      if (colorName) phone.colorName = colorName;
      await phone.save();

      // Log nhập kho máy thu cũ (sau khi tân trang)
      const inHeader = await InventoryTransaction.create({
        storeId: phone.storeId,
        transactionType: "INBOUND",
        referenceType: "TRADE_IN_REFURBISHED",
        referenceId: phone._id,
        totalItems: 1,
        note: `Nhập kho máy thu cũ (đã tân trang): ${phoneName || phone._id.toString().slice(-6)}`
      });

      await InventoryTransactionDetail.create({
        transactionId: inHeader._id,
        phoneId: phone._id,
        quantity: 1,
        note: "Máy tân trang"
      });

      // Trừ kho linh kiện thay thế (nếu có chọn thay)
      if (replacedItems && replacedItems.length > 0) {
        await Item.updateMany(
          { _id: { $in: replacedItems } },
          { status: "consumed" } 
        );

        const outHeader = await InventoryTransaction.create({
          storeId: phone.storeId,
          transactionType: "REPAIR_CONSUMPTION", 
          referenceType: "REFURBISH_PHONE",
          referenceId: phone._id,
          totalItems: replacedItems.length,
          note: `Xuất linh kiện để tân trang máy thu cũ: ${phoneName || phone._id.toString().slice(-6)}`
        });

        const itemLogs = replacedItems.map(itemId => ({
          transactionId: outHeader._id,
          itemId: itemId,
          quantity: 1,
          note: "Linh kiện thay thế"
        }));
        await InventoryTransactionDetail.insertMany(itemLogs);
      }

      return res.status(200).json({ message: "Đã tân trang và chuyển máy vào kho" });
    } 
    
    // 3. LUỒNG RÃ XÁC 
    if (decision === "DISMANTLE") {
      phone.status = "defective"; 
      await phone.save();

      // Log xuất tiêu hao máy mẹ
      const outHeader = await InventoryTransaction.create({
        storeId: phone.storeId,
        transactionType: "REPAIR_CONSUMPTION",
        referenceType: "DISMANTLE_PHONE",
        referenceId: phone._id,
        totalItems: 1,
        note: `Rã xác máy lấy linh kiện`
      });

      await InventoryTransactionDetail.create({
        transactionId: outHeader._id,
        phoneId: phone._id,
        quantity: 1,
        note: "Máy mẹ đem rã"
      });

      // Tạo & Nhập kho linh kiện con
      if (parts && parts.length > 0) {
        const itemsToCreate = parts.map((p) => ({
          name: p.name || `Linh kiện bóc máy`,
          item_type: p.itemTypeId,
          storeId: phone.storeId,
          serialCode: p.serialCode || `SN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*1000)}`,
          baseCost: Number(p.baseCost || 0),
          price: Number(p.price || 0),
          status: "in_stock",
          origin: "disassembled",
          sourceDevice: phoneName ? `${phoneName}` : `Máy bóc (Mã: ${phone._id.toString().slice(-6)})`,
          quality: p.quality || "Zin bóc máy",
          ram: p.ram || "",
          capacity: p.capacity || "",
          color: p.color || ""
        }));
        
        const insertedItems = await Item.insertMany(itemsToCreate);

        const inHeader = await InventoryTransaction.create({
            storeId: phone.storeId,
            transactionType: "INBOUND",
            referenceType: "DISMANTLE_PARTS",
            referenceId: phone._id,
            totalItems: insertedItems.length,
            note: `Nhập linh kiện rã từ máy mã: ${phone._id.toString().slice(-6).toUpperCase()}`
        });

        const itemLogs = insertedItems.map(item => ({
            transactionId: inHeader._id,
            itemId: item._id,
            quantity: 1,
            note: "Linh kiện bóc máy"
        }));
        await InventoryTransactionDetail.insertMany(itemLogs);
      }
      return res.status(200).json({ message: "Đã rã máy và ghi log nhập/xuất kho" });
    }
    res.status(400).json({ message: "Quyết định không hợp lệ" });
  } catch (error) {
    console.error("LỖI TECH DECISION:", error);
    res.status(500).json({ message: error.message });
  }
};

const createPhone = async (req, res) => {
    try {
        const { serialCode, phoneModelId, colorName, capacity, grade, storeId, status, importPrice, sellingPrice, warrantyPeriod, source, notes } = req.body;

        let specificImages = [];
        if (req.files && req.files.length > 0) {
            specificImages = req.files.map(file => file.path);
        }

        const finalSerialCode = serialCode || `PH-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*1000)}`;

        const newPhone = new Phone({
            serialCode: finalSerialCode,
            phoneModelId, colorName, capacity, grade, storeId, 
            status: status || 'in_stock',
            importPrice, sellingPrice, 
            warrantyPeriod: warrantyPeriod || 12,
            source: source || 'supplier',
            notes, specificImages
        });

        const savedPhone = await newPhone.save();
        res.status(201).json({ success: true, message: "Thêm máy vào kho thành công", data: savedPhone });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "Mã Serial Code này đã tồn tại!" });
        res.status(500).json({ success: false, message: error.message });
    }
};

const updatePhone = async (req, res) => {
    try {
        const { id } = req.params;
        let updateData = { ...req.body };
        
        let specificImages = [];
        if (req.body.retainedImages) {
            specificImages = JSON.parse(req.body.retainedImages);
        }
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => file.path);
            specificImages = [...specificImages, ...newImages];
        }
        updateData.specificImages = specificImages;

        const updatedPhone = await Phone.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!updatedPhone) return res.status(404).json({ success: false, message: "Không tìm thấy máy" });

        res.status(200).json({ success: true, message: "Cập nhật máy thành công", data: updatedPhone });
    } catch (error) {
        if (error.code === 11000) return res.status(400).json({ message: "Mã Serial Code bị trùng lặp!" });
        res.status(500).json({ success: false, message: error.message });
    }
};

const deletePhone = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedPhone = await Phone.findByIdAndDelete(id);
        if (!deletedPhone) return res.status(404).json({ success: false, message: "Không tìm thấy máy" });
        res.status(200).json({ success: true, message: "Xóa máy thành công" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getAllPhones = async (req, res) => {
    try {
        const phones = await Phone.find()
            .populate('phoneModelId', 'name brand')
            .populate('storeId', 'name');
        res.status(200).json({ success: true, data: phones });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};

const createAssembledPhone = async (req, res) => {
    try {
        const { phone_model, items, status, assembled_by, assembled_date, storeId } = req.body;

        if (!phone_model || !items || items.length === 0) {
            return res.status(400).json({ success: false, message: "Phone model and items are required" });
        }

        const itemDocs = await Item.find({ '_id': { $in: items } });
        if (itemDocs.length !== items.length) {
            return res.status(400).json({ success: false, message: "Some items not found" });
        }

        const outOfStockItems = itemDocs.filter(item => item.status !== 'in_stock');
        if (outOfStockItems.length > 0) {
            return res.status(400).json({ success: false, message: "Some items are not in stock" });
        }

        const imei = 'ASM' + Date.now() + Math.random().toString(36).substr(2, 9).toUpperCase();

        const newPhone = new Phone({
            imei, phoneModelId: phone_model, colorName: 'Assembled', capacity: 'N/A',
            storeId: storeId || "N/A", status: 'in_stock', source: 'assembled',
            items: items, importPrice: 0, sellingPrice: 0,
            notes: `Assembled by ${assembled_by} on ${new Date(assembled_date).toLocaleDateString()}`
        });

        await Item.updateMany( { '_id': { $in: items } }, { status: 'consumed' } );

        const savedPhone = await newPhone.save();

        const populatedPhone = await Phone.findById(savedPhone._id)
            .populate('phoneModelId', 'name brand')
            .populate('items', 'serial_code item_type notes')
            .populate('storeId', 'name address');

        res.status(201).json({ success: true, message: "Phone assembled successfully", data: populatedPhone });
    } catch (error) {
        console.error("Error assembling phone:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const getPhonesGroupedByBrand = async (req, res) => {
    try {
        const { status, storeId } = req.query;
        let phoneQuery = {};
        if (status) phoneQuery.status = status;
        if (storeId) phoneQuery.storeId = storeId;

        const phones = await Phone.find(phoneQuery)
            .populate({ path: 'phoneModelId', populate: { path: 'brand', select: 'name' } })
            .populate('storeId', 'name address')
            .sort({ createdAt: -1 });

        const phonesByBrand = {};
        phones.forEach(phone => {
            const brand = phone.phoneModelId?.brand;
            if (!brand) return;

            const brandName = brand.name;
            if (!phonesByBrand[brandName]) {
                phonesByBrand[brandName] = { brand: brand, phones: [] };
            }
            phonesByBrand[brandName].phones.push(phone);
        });

        res.status(200).json({ success: true, data: phonesByBrand });
    } catch (error) {
        console.error("Error getting phones grouped by brand:", error);
        res.status(500).json({ success: false, message: "Lỗi Server" });
    }
};

module.exports = {
    getPhonesPaginatedAndSearch,
    getAllPhones,
    createPhone,
    updatePhone,
    deletePhone,
    createAssembledPhone,
    getPhonesGroupedByBrand,
    handleTechDecision,
    generatePhoneQRCode
};