#!/bin/bash

# Set up the environment
export PATH="/Users/anantkan/.toolbox/bin:/usr/local/bin:/Users/anantkan/.nvm/versions/node/v22.9.0/bin:$PATH"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm

# Set the path to your Next.js app directory
APP_DIR="/Users/anantkan/nextjs-claude-chat-app"

bedrock_auth() {
    local acc_ids=(135601577239 749350688943 264195743615 181236673747 615299774946)
    local num_accounts=${#acc_ids[@]}
    local timestamp=$(date +%s)
    
    # Select four random accounts
    local index1=$((timestamp % num_accounts))
    local index2=$(((timestamp + 1) % num_accounts))
    local index3=$(((timestamp + 2) % num_accounts))
    local index4=$(((timestamp + 3) % num_accounts))
    
    local acc_id1="${acc_ids[index1]}"
    local acc_id2="${acc_ids[index2]}"
    local acc_id3="${acc_ids[index3]}"
    local acc_id4="${acc_ids[index4]}"
    
    echo "Authenticating for account: $acc_id1 with profile: bedrock"
    /Users/anantkan/.toolbox/bin/ada credentials update --once --account=$acc_id1 --provider=conduit --partition=aws --role=IibsAdminAccess-DO-NOT-DELETE --profile=bedrock
    
    echo "Authenticating for account: $acc_id2 with profile: bedrockvsc"
    /Users/anantkan/.toolbox/bin/ada credentials update --once --account=$acc_id2 --provider=conduit --partition=aws --role=IibsAdminAccess-DO-NOT-DELETE --profile=bedrockvsc
    
    echo "Authenticating for account: $acc_id3 with profile: pranx"
    /Users/anantkan/.toolbox/bin/ada credentials update --once --account=$acc_id3 --provider=conduit --partition=aws --role=IibsAdminAccess-DO-NOT-DELETE --profile=pranx
    
    echo "Authenticating for account: $acc_id4 with profile: prany"
    /Users/anantkan/.toolbox/bin/ada credentials update --once --account=$acc_id4 --provider=conduit --partition=aws --role=IibsAdminAccess-DO-NOT-DELETE --profile=prany
    
    unset AWS_ACCESS_KEY_ID
    unset AWS_SECRET_ACCESS_KEY
    unset AWS_SESSION_TOKEN
    /usr/local/bin/aws configure set cli_pager ""
}

stop_server() {
    # Forcefully kill any process running on port 3000
    lsof -ti:3000 | xargs kill -9 2>/dev/null

    # Also try to kill using the PID file if it exists
    if [ -f /tmp/claudechat_server.pid ]; then
        pid=$(cat /tmp/claudechat_server.pid)
        kill -9 $pid 2>/dev/null
        rm /tmp/claudechat_server.pid
    fi
}

start_server() {
    cd "$APP_DIR"
    PORT=3000 /Users/anantkan/.nvm/versions/node/v22.9.0/bin/npm run dev &
    echo $! > /tmp/claudechat_server.pid
}

restart_server() {
    stop_server
    sleep 5  # Wait a bit to ensure the server has stopped
    bedrock_auth
    start_server
    echo "Server restarted at $(date) using primary profile $AWS_PROFILE" >> "$APP_DIR/server.log"
}

# Main execution
while true; do
    restart_server
    sleep 1800  # Sleep for 30 minutes (1800 seconds)
done
