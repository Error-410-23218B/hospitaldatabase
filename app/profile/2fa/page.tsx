import React, { useState, useEffect } from 'react';
import * as QRCode from 'qrcode.react';
import { useAuth } from '@/lib/auth-context';

export default function Patient2FAManagement() {
  const { user, loading } = useAuth();
  const [secret, setSecret] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [token, setToken] = useState('');
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [loadingState, setLoadingState] = useState(false);

  // Fetch current 2FA status on mount
  useEffect(() => {
    async function fetchStatus() {
      if (!user?.id) return;
      try {
        const res = await fetch('/api/patient-2fa/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patientId: user.id }),
        });
          if (res.ok) {
            const data = await res.json();
            setTwoFactorEnabled(data.twoFactorEnabled);
            setSmsEnabled(data.smsenabled);
          }
      } catch (error) {
        console.error('Error fetching 2FA status:', error);
      }
    }
    fetchStatus();
  }, [user]);


  // Generate new secret and QR code
  async function generateSecret() {
    if (!user?.id) return;
    setLoadingState(true);
    setMessage('');
    try {
      const res = await fetch('/api/patient-2fa/generate-secret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: user.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setSecret(data.secret);
        const otpauthUrl = `otpauth://totp/HospitalApp:${encodeURIComponent(user.email)}?secret=${data.secret}&issuer=HospitalApp`;
        setQrCodeUrl(otpauthUrl);
      } else {
        setMessage(data.error || 'Failed to generate secret');
      }
    } catch (error) {
      setMessage('Error generating secret');
    }
    setLoadingState(false);
  }

  // Enable 2FA by verifying token
  async function enable2FA() {
    if (!user?.id) return;
    setLoadingState(true);
    setMessage('');
    try {
      const res = await fetch('/api/patient-2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: user.id, token, secret }),
      });
      const data = await res.json();
      if (res.ok) {
        setTwoFactorEnabled(true);
        setMessage('2FA enabled successfully');
      } else {
        setMessage(data.error || 'Failed to enable 2FA');
      }
    } catch (error) {
      setMessage('Error enabling 2FA');
    }
    setLoadingState(false);
  }

  // Disable 2FA
  async function disable2FA() {
    if (!user?.id) return;
    setLoadingState(true);
    setMessage('');
    try {
      const res = await fetch('/api/patient-2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientId: user.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setTwoFactorEnabled(false);
        setSecret('');
        setQrCodeUrl('');
        setToken('');
        setMessage('2FA disabled successfully');
      } else {
        setMessage(data.error || 'Failed to disable 2FA');
      }
    } catch (error) {
      setMessage('Error disabling 2FA');
    }
    setLoadingState(false);
  }

  if (loading) {
    return <p>Loading user data...</p>;
  }

  return (
    <div>
      <h1>Two-Factor Authentication (2FA) Management</h1>
      {twoFactorEnabled ? (
        <div>
          <p>2FA is currently enabled on your account.</p>
          <button onClick={disable2FA} disabled={loadingState}>
            Disable 2FA
          </button>
        </div>
      ) : (
        <div>
          {!smsEnabled && (
            <>
              <button onClick={generateSecret} disabled={loadingState}>
                Generate 2FA Secret
              </button>
              {qrCodeUrl && (
                <div>
                  <p>Scan this QR code with your authenticator app:</p>
              <QRCode.QRCode value={qrCodeUrl} />
                  <p>Or enter this secret manually: {secret}</p>
                  <input
                    type="text"
                    placeholder="Enter token from app"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                  />
                  <button onClick={enable2FA} disabled={loadingState || !token}>
                    Enable 2FA
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
      {message && <p>{message}</p>}
    </div>
  );
}
