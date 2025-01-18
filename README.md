# Yield Sync V1 EMP

EMP (Asset Management Protocol) is a protocol that allows automated allocations for managing assets. Whether it be for yield optimization or public goods funding, this protocol allows developers to create the tool they need to direct funds accordingly.

## Note

Once this project is done and deployed to networks this repo should become archived. No further changes should be accepted

This protocol complies to the [yield-sync/specifications](https://github.com/yield-sync/specifications/tree/master/v1-amp)

## Get Started

```shell
npm install
```

## Automated Testing

```shell
npx hardhat test
```

## Get Contract Sizes
```shell
npx hardhat size-contracts
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

The ETH value should handle the decimal of the erc 20

### How to check contract size

```sol
npx hardhat size-contracts
```

### Chainlink Price Feed

#### Ethereum Mainnet

ETH/USD: [0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419](https://etherscan.io/address/0x5f4ec3df9cbd43714fe2740f5e3616155c5b8419)

USDC/USD: [0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6](https://etherscan.io/address/0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6)

#### Base Sepolia 

ETH/USD: [0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1](https://sepolia.basescan.org/address/0x4aDC67696bA383F43DD60A9e78F2C97Fbbfc7cb1)

USDC/USD: [0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165](https://sepolia.basescan.org/address/0xd30e2101a97dcbAeBCBC04F14C3f624E67A35165)
