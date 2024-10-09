#!/bin/bash

# Set the path to your Next.js app directory
APP_DIR="/Users/anantkan/nextjs-claude-chat-app"

acc_ids=(135601577239 749350688943 358457881900 264195743615 428833270422)

# Function to select an account ID based on timestamp
select_account_id() {
    local timestamp=$(date +%s)
    local index=$((timestamp % ${#acc_ids[@]}))
    echo "${acc_ids[index]}"
}

# Define the adacreds function
adacreds() {
    local account=$1
    local region=$2
    local profile=${3:-default}
    ada credentials update --once --account=$account --provider=conduit --partition=aws --role=IibsAdminAccess-DO-NOT-DELETE --profile=$profile
    unset AWS_ACCESS_KEY_ID
    unset AWS_SECRET_ACCESS_KEY
    unset AWS_SESSION_TOKEN
    aws configure set default.region $region
    aws configure set cli_pager ""
}

start_server() {
    cd "$APP_DIR"
    npm run dev
    echo $! > /tmp/claudechat_server.pid
}

stop_server() {
    if [ -f /tmp/claudechat_server.pid ]; then
        pid=$(cat /tmp/claudechat_server.pid)
        kill $pid
        rm /tmp/claudechat_server.pid
    else
        lsof -ti:3000 | xargs kill -9
    fi
}

bedrockauth() {
    local account=$1
    adacreds $account us-east-1 bedrock
}

# Main execution
# stop_server

selected_acc_id=$(select_account_id)
echo "Authenticating for account: $selected_acc_id"
bedrockauth $selected_acc_id

start_server

echo "Server restarted at $(date)" >> "$APP_DIR/server.log"
