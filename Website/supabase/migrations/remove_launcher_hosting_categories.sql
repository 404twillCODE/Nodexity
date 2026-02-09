-- Remove Launcher and Hosting support categories; keep only General and Server Manager.
DELETE FROM "Category" WHERE slug IN ('launcher', 'hosting');
