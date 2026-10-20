-- READ ONLY. Run on the restored staging database after schema review.
SELECT COALESCE("stateCode",'<NULL>') AS state_code,COUNT(*) AS districts FROM "District" GROUP BY "stateCode";
SELECT COALESCE("stateCode",'<NULL>') AS state_code,"scope",COUNT(*) AS polls FROM "Poll" GROUP BY "stateCode","scope";
SELECT COUNT(*) AS polls_without_district_id FROM "Poll" WHERE "districtId" IS NULL AND "districtName" IS NOT NULL;
SELECT COUNT(*) AS gp_ids_without_matching_record FROM "Poll" p WHERE p."gramPanchayatId" IS NOT NULL AND NOT EXISTS(SELECT 1 FROM "GramPanchayat" g WHERE g.id=p."gramPanchayatId");
SELECT COUNT(*) AS samitis_without_tehsil_mapping FROM "PanchayatSamiti" WHERE "tehsilId" IS NULL;
SELECT (SELECT COALESCE(SUM("voteCount"),0) FROM "PollOption") AS stored_total,(SELECT COUNT(*) FROM "Vote") AS vote_records;
