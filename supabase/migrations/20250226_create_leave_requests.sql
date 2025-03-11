-- Create leave_requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Create RLS policies
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Policy for users to view their own leave requests
CREATE POLICY "Users can view their own leave requests"
    ON leave_requests FOR SELECT
    USING (auth.uid() = user_id);

-- Policy for users to insert their own leave requests
CREATE POLICY "Users can create their own leave requests"
    ON leave_requests FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy for users to update their own pending leave requests
CREATE POLICY "Users can update their own pending leave requests"
    ON leave_requests FOR UPDATE
    USING (auth.uid() = user_id AND status = 'PENDING');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_leave_requests_updated_at
    BEFORE UPDATE ON leave_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
