import { useState } from 'react';
import api from '../../api/axios';

// Opens the PDF by creating a temporary blob URL
const ExportButton = ({ chamaId, memberId, label = 'Download Statement' }) => {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/chamas/${chamaId}/reports/member/${memberId}`, {
        responseType: 'blob'   // receive binary PDF data
      });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `statement-${memberId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert('Failed to generate PDF');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleExport} disabled={loading}>
      {loading ? 'Generating...' : label}
    </button>
  );
};

export default ExportButton;