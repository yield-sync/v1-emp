# Yield Sync V1 EMP

EMP (Asset Management Protocol) is a protocol that allows automated allocations for managing assets. Whether it be for yield optimization or public goods funding, this protocol allows developers to create the tool they need to direct funds accordingly.

## Note

This protocol complies to the [yield-sync/specifications](https://github.com/yield-sync/specifications/tree/master/v1-amp)

## Get Started

```shell
npm install
```

## Automated Testing

```shell
npx hardhat test
```

## `.env` example

```shell
# Wallet Private Key
PRIVATE_KEY=

# API keys
INFURA_API_KEY=
ETHERSCAN_API_KEY=
OPTIMISTIC_ETHERSCAN_API_KEY=

# Governance Addresses
YIELD_SYNC_GOVERNANCE_ADDRESS_MAINNET=
YIELD_SYNC_GOVERNANCE_ADDRESS_OP=
YIELD_SYNC_GOVERNANCE_ADDRESS_OP_GOERLI=
YIELD_SYNC_GOVERNANCE_ADDRESS_SEPOLIA=

# Deployed Registry
YIELD_SYNC_V1_VAULT_REGISTRY_MAINNET=
YIELD_SYNC_V1_VAULT_REGISTRY_OP=
YIELD_SYNC_V1_VAULT_REGISTRY_OP_GOERLI=
YIELD_SYNC_V1_VAULT_REGISTRY_SEPOLIA=

# Deployed Factory
YIELD_SYNC_V1_VAULT_FACTORY_ADDRESS_MAINNET=
YIELD_SYNC_V1_VAULT_FACTORY_ADDRESS_OP=
YIELD_SYNC_V1_VAULT_FACTORY_ADDRESS_OP_GOERLI=
YIELD_SYNC_V1_VAULT_FACTORY_ADDRESS_SEPOLIA=

# Deployed Yield Sync V1 B Transfer Request Protocol
YIELD_SYNC_V1_A_TRANSFER_REQUEST_PROTOCOL_MAINNET=
YIELD_SYNC_V1_A_TRANSFER_REQUEST_PROTOCOL_OP=
YIELD_SYNC_V1_A_TRANSFER_REQUEST_PROTOCOL_OP_GOERLI=
YIELD_SYNC_V1_A_TRANSFER_REQUEST_PROTOCOL_SEPOLIA=

# Deployed Yield Sync V1 B Transfer Request Protocol
YIELD_SYNC_V1_B_TRANSFER_REQUEST_PROTOCOL_MAINNET=
YIELD_SYNC_V1_B_TRANSFER_REQUEST_PROTOCOL_OP=
YIELD_SYNC_V1_B_TRANSFER_REQUEST_PROTOCOL_OP_GOERLI=
YIELD_SYNC_V1_B_TRANSFER_REQUEST_PROTOCOL_SEPOLIA=
```

## Note

Strategies must be very simple. They should be able to be changed. Tokens utilized must be immutable.
