#!/usr/bin/env bash
# Set up GenericHandlers so that they can request and push prices to local MockOracles. This sets up the Bridges
# so that the user can 
#     (1) call deposit() to the DST_BRIDGE to request a price on the SRC_ORACLE
#     (2) call deposit() to the SRC_BRIDGE to push a price on the DST_ORACLE

# 1. Destination Bridge should requestPrice for deposits, and pushPrice when the relayer calls executeProposal.
cb-sol-cli --url $DST_GATEWAY --privateKey $DST_PK --gasPrice 10000000000 bridge register-generic-resource --bridge $DST_BRIDGE --handler $DST_HANDLER --resourceId $RESOURCE_ID --targetContract $DST_ORACLE --execute "pushPrice(bytes32,uint256,bytes,int256)" --deposit "requestPrice(bytes32,uint256,bytes)" --hash

# 2. Source Bridge should pushPrice for deposits, and requestPrice when the relayer calls executeProposal.
cb-sol-cli --url $SRC_GATEWAY --privateKey $SRC_PK --gasPrice 10000000000 bridge register-generic-resource --bridge $SRC_BRIDGE --handler $SRC_HANDLER --resourceId $RESOURCE_ID --targetContract $SRC_ORACLE --execute "requestPrice(bytes32,uint256,bytes)" --deposit "pushPrice(bytes32,uint256,bytes,int256)" --hash