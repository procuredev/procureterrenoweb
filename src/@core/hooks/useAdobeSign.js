import { useState } from 'react';
import { createAgreement, getAgreementStatus } from '../../adobe/adobeSign';

export const useAdobeSign = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [agreement, setAgreement] = useState(null);

  // Hook para crear un acuerdo
  const handleCreateAgreement = async (documentId, signerEmail) => {
    setLoading(true);
    try {
      const agreementData = await createAgreement(documentId, signerEmail);
      setAgreement(agreementData);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  // Hook para obtener el estado de un acuerdo
  const handleGetAgreementStatus = async (agreementId) => {
    setLoading(true);
    try {
      const statusData = await getAgreementStatus(agreementId);
      setAgreement(statusData);
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
    handleCreateAgreement,
    handleGetAgreementStatus
  };
};
