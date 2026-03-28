-- 1. Create the master table to store each recommendation set
CREATE TABLE recommendation_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  -- The user who generated this result, can be null if the user wasn't logged in
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  -- The inputs that generated this result
  steam_id text,
  budget_krw int,
  tags text[],
  -- The actual recommendation cards
  cards jsonb NOT NULL
);

-- 2. Enable Row Level Security
ALTER TABLE recommendation_sets ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy that allows anyone to read the results.
--    This is necessary for the shared result pages (/result/[id]) to be public.
CREATE POLICY "Enable public read access" ON recommendation_sets
  FOR SELECT USING (true);

-- 4. Create a policy that allows logged-in users to see their own past results.
--    This will be used for a future "My History" page.
CREATE POLICY "Enable users to read their own sets" ON recommendation_sets
  FOR SELECT USING (auth.uid() = user_id);

-- 5. Users can only insert new sets, but cannot update or delete them.
--    This policy allows any authenticated user to insert.
--    We will also handle anonymous insertions via the API route using the service_role key.
CREATE POLICY "Enable insert for authenticated users" ON recommendation_sets
  FOR INSERT TO authenticated WITH CHECK (true);
