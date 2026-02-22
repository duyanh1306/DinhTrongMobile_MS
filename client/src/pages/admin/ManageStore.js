import { useState, useEffect } from "react";
import { Edit, Trash2, Plus, X } from "lucide-react";
import AdminLayout from "../../layouts/AdminLayout";

export default function ManageStore() {
  const [stores, setStores] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ code: "", name: "", location: "" });

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const res = await fetch("http://localhost:9999/api/stores");
      if (res.ok) {
        const data = await res.json();
        setStores(data);
      }
    } catch (error) {
      console.error("Error fetching stores:", error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this store?")) {
      try {
        const res = await fetch(`http://localhost:9999/api/stores/${id}`, {
          method: "DELETE",
        });
        if (res.ok) {
          setStores(stores.filter((store) => store._id !== id));
        }
      } catch (error) {
        console.error("Error deleting store:", error);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:9999/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const newStore = await res.json();
        setStores([...stores, newStore]);
        setIsModalOpen(false);
        setFormData({ code: "", name: "", location: "" }); // Reset form
      } else {
        console.error("Failed to create store");
      }
    } catch (error) {
      console.error("Error creating store:", error);
    }
  };

  return (
    <AdminLayout>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Manage Stores</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <Plus size={18} />
            Create New Store
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100 border-b border-gray-200">
                <th className="p-3 font-semibold text-gray-700">Code</th>
                <th className="p-3 font-semibold text-gray-700">Name</th>
                <th className="p-3 font-semibold text-gray-700">Location</th>
                <th className="p-3 font-semibold text-gray-700 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((store) => (
                <tr key={store._id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">{store.code}</td>
                  <td className="p-3">{store.name}</td>
                  <td className="p-3">{store.location}</td>
                  <td className="p-3 flex justify-center gap-3">
                    <button className="text-blue-500 hover:text-blue-700">
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(store._id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {stores.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-6 text-center text-gray-500">
                    No stores found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Create Store */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md relative shadow-xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
            >
              <X size={20} />
            </button>
            <h3 className="text-xl font-bold mb-4 text-gray-800">Create New Store</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Code</label>
                <input
                  type="text"
                  name="code"
                  value={formData.code}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., STORE-1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Cửa hàng chính"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Đan Phượng, Hà Nội"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Save Store
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}