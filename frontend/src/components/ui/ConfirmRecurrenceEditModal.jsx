import React from 'react';

const ConfirmRecurrenceEditModal = ({ onConfirm, onCancel, editType }) => {
  const isDelete = editType === 'delete';
  const title = isDelete ? 'Delete Recurring Event' : 'Edit Recurring Event';
  const action = isDelete ? 'delete' : 'edit';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm">
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <p className="mb-6">Would you like to {action} only this event, or all events in the series?</p>
        <div className="flex flex-col space-y-3">
          <button
            onClick={() => onConfirm('instance')}
            className="px-4 py-2 bg-water-blue-mid text-white rounded-lg shadow-md hover:bg-water-blue-end"
          >
            {isDelete ? 'Delete' : 'Save'} This Event Only
          </button>
          <button
            onClick={() => onConfirm('series')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg shadow-md hover:bg-gray-700"
          >
            {isDelete ? 'Delete' : 'Save'} The Entire Series
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 mt-2"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmRecurrenceEditModal;