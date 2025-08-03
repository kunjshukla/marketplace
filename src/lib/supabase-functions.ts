import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Types
export interface Lead {
  id: string
  name: string
  email: string
  phone?: string
  address?: string
  wallet_address?: string
  nft_id?: string
  nft_purchased?: string
  payment_method?: string
  payment_status?: string
  transaction_id?: string
  amount?: number
  contract_address?: string
  created_at: string
  updated_at: string
}

export interface NFTDrop {
  id: string
  title: string
  description: string
  image_url: string
  buyback_value: number
  total_quantity: number
  sold_quantity: number
  price_inr: number
  is_active: boolean
  created_at: string
}

export interface Transaction {
  id: string
  lead_id: string
  nft_drop_id?: string
  payment_gateway: 'razorpay' | 'paypal'
  gateway_txn_id: string
  amount: number
  currency: string
  status: 'pending' | 'complete' | 'failed'
  gateway_response: any
  created_at: string
}

// Lead functions
export async function createLead(leadData: Omit<Lead, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .insert([leadData])
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error creating lead:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function findLead(leadId: string) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error finding lead:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function findLeadByEmail(email: string) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('email', email)
      .single()

    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found

    return { success: true, data }
  } catch (error) {
    console.error('Error finding lead by email:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateLeadAfterPayment(
  leadId: string, 
  updateData: {
    txn_id: string
    amount: number
    currency: string
    nft_id?: string
    contract_address?: string
  }
) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({
        nft_id: updateData.nft_id,
        contract_address: updateData.contract_address,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error updating lead after payment:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateLeadWalletAddress(leadId: string, walletAddress: string) {
  try {
    const { data, error } = await supabase
      .from('leads')
      .update({
        wallet_address: walletAddress,
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error updating lead wallet address:', error)
    return { success: false, error: (error as Error).message }
  }
}

// NFT Drop functions
export async function getTodaysNFTDrop() {
  try {
    const { data, error } = await supabase
      .from('nft_drops')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error getting today\'s NFT drop:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function createNFTDrop(dropData: Omit<NFTDrop, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('nft_drops')
      .insert([dropData])
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error creating NFT drop:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateNFTDropSoldQuantity(dropId: string) {
  try {
    const { data, error } = await supabase
      .rpc('increment_sold_quantity', { drop_id: dropId })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error updating NFT drop sold quantity:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getAllNFTDrops() {
  try {
    const { data, error } = await supabase
      .from('nft_drops')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error getting all NFT drops:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Transaction functions
export async function createTransaction(transactionData: Omit<Transaction, 'id' | 'created_at'>) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .insert([transactionData])
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error creating transaction:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function updateTransactionStatus(
  transactionId: string, 
  status: Transaction['status'],
  additionalData?: any
) {
  try {
    const updatePayload: any = { status }
    if (additionalData) {
      updatePayload.gateway_response = additionalData
    }

    const { data, error } = await supabase
      .from('transactions')
      .update(updatePayload)
      .eq('gateway_txn_id', transactionId)
      .select()
      .single()

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error updating transaction status:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getTransactionsByLead(leadId: string) {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error('Error getting transactions by lead:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Analytics functions
export async function getLeadStats() {
  try {
    const { data, error } = await supabase
      .from('leads')
      .select('id, created_at, nft_id')

    if (error) throw error

    const totalLeads = data.length
    const convertedLeads = data.filter(lead => lead.nft_id).length
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0

    return {
      success: true,
      data: {
        total_leads: totalLeads,
        converted_leads: convertedLeads,
        conversion_rate: conversionRate
      }
    }
  } catch (error) {
    console.error('Error getting lead stats:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function getRevenueStats() {
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('amount, currency, created_at')
      .eq('status', 'complete')

    if (error) throw error

    const totalRevenue = data.reduce((sum, txn) => sum + txn.amount, 0)
    const totalTransactions = data.length

    return {
      success: true,
      data: {
        total_revenue: totalRevenue,
        total_transactions: totalTransactions,
        transactions: data
      }
    }
  } catch (error) {
    console.error('Error getting revenue stats:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Database initialization SQL (run this in Supabase SQL editor)
export const initializeDatabaseSQL = `
-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  wallet_address VARCHAR(255),
  nft_id VARCHAR(255),
  contract_address VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create nft_drops table
CREATE TABLE IF NOT EXISTS nft_drops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  buyback_value DECIMAL(10,2) NOT NULL,
  total_quantity INTEGER NOT NULL DEFAULT 100,
  sold_quantity INTEGER NOT NULL DEFAULT 0,
  price_inr DECIMAL(10,2) NOT NULL DEFAULT 49.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  nft_drop_id UUID REFERENCES nft_drops(id) ON DELETE SET NULL,
  payment_gateway VARCHAR(20) NOT NULL CHECK (payment_gateway IN ('razorpay', 'paypal')),
  gateway_txn_id VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(10) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'complete', 'failed')),
  gateway_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to increment sold quantity
CREATE OR REPLACE FUNCTION increment_sold_quantity(drop_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE nft_drops 
  SET sold_quantity = sold_quantity + 1 
  WHERE id = drop_id;
END;
$$ LANGUAGE plpgsql;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_wallet_address ON leads(wallet_address);
CREATE INDEX IF NOT EXISTS idx_transactions_lead_id ON transactions(lead_id);
CREATE INDEX IF NOT EXISTS idx_transactions_gateway_txn_id ON transactions(gateway_txn_id);
CREATE INDEX IF NOT EXISTS idx_nft_drops_is_active ON nft_drops(is_active);

-- Insert sample NFT drop
INSERT INTO nft_drops (title, description, image_url, buyback_value, total_quantity, price_inr)
VALUES (
  'Genesis Art Collection',
  'Limited edition digital art NFTs with guaranteed buyback value. Perfect for art investors looking for stable returns.',
  'https://example.com/nft-image.jpg',
  99.00,
  100,
  49.00
) ON CONFLICT DO NOTHING;
`;
