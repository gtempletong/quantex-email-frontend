import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Obtener contactos de Supabase
    const { data: contacts, error } = await supabase
      .from('personas')
      .select('id, nombre_contacto, email_contacto, email_sent, email_sent_at, rut_empresa')
      .order('nombre_contacto', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: 'Error fetching contacts' });
    }

    // Obtener información de empresas para cada contacto
    const contactsWithCompanies = await Promise.all(
      contacts.map(async (contact) => {
        if (contact.rut_empresa) {
          const { data: empresa } = await supabase
            .from('empresas')
            .select('razon_social')
            .eq('rut_empresa', contact.rut_empresa)
            .single();
          
          return {
            ...contact,
            razon_social: empresa?.razon_social || null
          };
        }
        return contact;
      })
    );

    res.status(200).json({
      success: true,
      contacts: contactsWithCompanies,
      count: contactsWithCompanies.length
    });

  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}