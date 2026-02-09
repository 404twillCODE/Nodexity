-- Direct messages: conversations between two users (staff can start DMs with any user).
-- user1_id < user2_id to keep a single row per pair.

CREATE TABLE IF NOT EXISTS "Conversation" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user1Id" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "user2Id" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "Conversation_user1_user2_order" CHECK ("user1Id" < "user2Id"),
  CONSTRAINT "Conversation_user1_user2_unique" UNIQUE ("user1Id", "user2Id")
);

CREATE TABLE IF NOT EXISTS "DirectMessage" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "conversationId" UUID NOT NULL REFERENCES "Conversation"("id") ON DELETE CASCADE,
  "senderId" UUID NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "body" TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "Conversation_user1Id_idx" ON "Conversation"("user1Id");
CREATE INDEX IF NOT EXISTS "Conversation_user2Id_idx" ON "Conversation"("user2Id");
CREATE INDEX IF NOT EXISTS "DirectMessage_conversationId_idx" ON "DirectMessage"("conversationId");
CREATE INDEX IF NOT EXISTS "DirectMessage_createdAt_idx" ON "DirectMessage"("createdAt");

-- RLS: participants can read/write their conversations and messages.
ALTER TABLE "Conversation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DirectMessage" ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Conversation_select_own" ON "Conversation";
CREATE POLICY "Conversation_select_own" ON "Conversation"
  FOR SELECT USING (
    auth.uid() = "user1Id" OR auth.uid() = "user2Id"
  );

DROP POLICY IF EXISTS "Conversation_insert_own" ON "Conversation";
CREATE POLICY "Conversation_insert_own" ON "Conversation"
  FOR INSERT WITH CHECK (
    auth.uid() = "user1Id" OR auth.uid() = "user2Id"
  );

DROP POLICY IF EXISTS "DirectMessage_select_conversation" ON "DirectMessage";
CREATE POLICY "DirectMessage_select_conversation" ON "DirectMessage"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "Conversation" c
      WHERE c.id = "DirectMessage"."conversationId"
        AND (c."user1Id" = auth.uid() OR c."user2Id" = auth.uid())
    )
  );

DROP POLICY IF EXISTS "DirectMessage_insert_conversation" ON "DirectMessage";
CREATE POLICY "DirectMessage_insert_conversation" ON "DirectMessage"
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM "Conversation" c
      WHERE c.id = "DirectMessage"."conversationId"
        AND (c."user1Id" = auth.uid() OR c."user2Id" = auth.uid())
    )
  );
