# Staffing SQL tests (disposable database only)

Never point these at a live project. They create a throwaway Postgres 17 container.

```bash
docker run -d --rm --name eccp-sqltest -e POSTGRES_HOST_AUTH_METHOD=trust postgres:17
P="docker exec -i eccp-sqltest psql -U postgres -v ON_ERROR_STOP=1 -q"
$P < ops/sql-tests/staffing-base.sql          # live table shapes + live message_actor
$P < ops/staffing-schema-proposed.sql
$P < ops/staffing-assign-function-proposed.sql
$P < ops/staffing-cancel-cover-functions-proposed.sql
bash ops/sql-tests/staffing-assign-tests.sh        # each line states the expected result
bash ops/sql-tests/staffing-cancel-cover-tests.sh  # run second: reuses the assign data
docker stop eccp-sqltest
```

`service_role` is created with `bypassrls`, as on Supabase; without it every
sync write silently matches no rows.
