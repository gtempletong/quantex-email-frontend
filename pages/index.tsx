import { useState, useEffect } from 'react';

interface Contact {
  id: string;
  nombre_contacto: string;
  email_contacto: string;
  razon_social?: string;
  email_sent: boolean;
  email_sent_at?: string;
}

export default function Home() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/modular-agent/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: 'Encuentra todas las personas en la base de datos'
        })
      });
      const data = await response.json();
      
      console.log('API Response:', data); // Debug log
      
      if (data.success && data.result.results) {
        // Buscar el resultado de supabase.query_table
        const queryResult = data.result.results.find((r: any) => r.tool === 'supabase.query_table');
        if (queryResult?.response?.data) {
          setContacts(queryResult.response.data);
        }
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendIntroEmail = async (contact: Contact) => {
    setSending(contact.id);
    try {
      const response = await fetch(`${API_BASE}/api/modular-agent/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `Envía email con plantilla a ${contact.nombre_contacto}`
        })
      });
      const data = await response.json();
      
      if (data.success) {
        alert('Email enviado exitosamente');
        fetchContacts(); // Refresh list
      } else {
        alert(`Error: ${data.error || 'Error desconocido'}`);
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Error enviando email');
    } finally {
      setSending(null);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Cargando contactos...</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>📧 Quantex Email Dashboard</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <button onClick={fetchContacts} style={{ padding: '10px 20px', marginRight: '10px' }}>
          🔄 Actualizar
        </button>
        <span>Total: {contacts.length} contactos</span>
      </div>

      <div style={{ display: 'grid', gap: '15px' }}>
        {contacts.map((contact) => (
          <div
            key={contact.id}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              padding: '15px',
              backgroundColor: contact.email_sent ? '#f0f8f0' : '#fff'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: '0 0 5px 0' }}>{contact.nombre_contacto}</h3>
                <p style={{ margin: '0 0 5px 0', color: '#666' }}>{contact.email_contacto}</p>
                {contact.razon_social && (
                  <p style={{ margin: '0', fontSize: '14px', color: '#888' }}>
                    {contact.razon_social}
                  </p>
                )}
              </div>
              
              <div style={{ textAlign: 'right' }}>
                {contact.email_sent ? (
                  <div>
                    <div style={{ color: 'green', fontWeight: 'bold' }}>✅ Intro enviada</div>
                    {contact.email_sent_at && (
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {new Date(contact.email_sent_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => sendIntroEmail(contact)}
                    disabled={sending === contact.id}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: sending === contact.id ? 'not-allowed' : 'pointer'
                    }}
                  >
                    {sending === contact.id ? 'Enviando...' : '📧 Enviar Intro'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {contacts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          No se encontraron contactos
        </div>
      )}
    </div>
  );
}