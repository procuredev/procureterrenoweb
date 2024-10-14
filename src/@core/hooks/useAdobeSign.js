import { useState } from 'react';
import { createAgreement } from 'src/adobe/adobeSign';

export const useAdobeSign = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agreement, setAgreement] = useState(null);

  // Hook para crear un acuerdo
  const handleCreateAgreement = async (documentId) => {
    setLoading(true);
    try {
      const agreementData = await createAgreement(documentId);
      setAgreement(agreementData);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };


  return {
    loading,
    error,
    agreement,
    handleCreateAgreement
  };
};
