#!/bin/sh
echo "NEXT_PUBLIC_API_BASE_URL: $NEXT_PUBLIC_API_BASE_URL"
echo "NEXT_PUBLIC_MAX_DAYS: $NEXT_PUBLIC_MAX_DAYS"
echo "PORT: $PORT"

echo "Check that we have NEXT_PUBLIC_API_BASE_URL and NEXT_PUBLIC_MAX_DAYS vars"

export NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL:-"http://localhost:5005"}
export NEXT_PUBLIC_MAX_DAYS=${NEXT_PUBLIC_MAX_DAYS:-"90"}

test -n "$NEXT_PUBLIC_API_BASE_URL"
test -n "$NEXT_PUBLIC_MAX_DAYS"
test -n "$PORT"

find /app/apps/web/.next \( -type d -name .git -prune \) -o -type f -print0 | xargs -0 sed -i "s#APP_NEXT_PUBLIC_API_BASE_URL#$NEXT_PUBLIC_API_BASE_URL#g"
find /app/apps/web/.next \( -type d -name .git -prune \) -o -type f -print0 | xargs -0 sed -i "s#APP_NEXT_PUBLIC_MAX_DAYS#$NEXT_PUBLIC_MAX_DAYS#g"
find /app/apps/web/.next \( -type d -name .git -prune \) -o -type f -print0 | xargs -0 sed -i "s#PORT#$PORT#g"

echo "Starting Nextjs"
exec "$@"
