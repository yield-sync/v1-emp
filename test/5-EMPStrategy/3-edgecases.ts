import { expect } from "chai";
import { BigNumber, Contract, ContractFactory, VoidSigner } from "ethers";

import stageContracts, { suiteSpecificSetup } from "./stage-contracts-5";
import { ERROR, PERCENT, D_18 } from "../../const";
import UtilStrategyTransfer from "../../util/UtilStrategyTransfer";


const { ethers } = require("hardhat");


const LOCATION_IERC20: string = "@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20";


describe("[5.3] V1EMPStrategy.sol - Edge-cases", async () => {
	let eTHValueProvider: Contract;
	let eRC20Handler: Contract;
	let registry: Contract;
	let strategy: Contract;

	let mockERC20A: Contract;
	let mockERC20B: Contract;
	let mockERC20C: Contract;
	let strategyDeployer: Contract;

	let utilStrategyTransfer: UtilStrategyTransfer;

	let owner: VoidSigner;


	beforeEach("[beforeEach] Set up contracts..", async () => {
		(
			{
				eTHValueProvider,
				registry,
				mockERC20A,
				mockERC20B,
				mockERC20C,
				owner,
				strategyDeployer
			} = await stageContracts()
		);

		({ eRC20Handler, strategy, utilStrategyTransfer,}  = await suiteSpecificSetup(registry, strategyDeployer, owner));

		await strategy.iERC20HandlerUpdate(eRC20Handler.address);
		await strategy.utilizedERC20DepositOpenUpdate(true);
		await strategy.utilizedERC20WithdrawOpenUpdate(true);

		expect(await strategy.utilizedERC20DepositOpen()).to.be.true;
		expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;
	});

	describe("Utilized ERC20 price change", async () => {
		beforeEach(async () => {
			await strategy.utilizedERC20DepositOpenUpdate(false);

			expect(await strategy.utilizedERC20DepositOpen()).to.be.false;

			await strategy.utilizedERC20WithdrawOpenUpdate(false);

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.false;

			// Set strategy ERC20 tokens
			await expect(
				strategy.utilizedERC20Update([mockERC20A.address], [[true, true, PERCENT.HUNDRED]])
			).to.be.not.rejected;

			await strategy.utilizedERC20DepositOpenUpdate(true);

			expect(await strategy.utilizedERC20DepositOpen()).to.be.true;

			await strategy.utilizedERC20WithdrawOpenUpdate(true);

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;
		});


		describe("function utilizedERC20Deposit()", async () => {
			const DEPOSIT_AMOUNT: BigNumber = ethers.utils.parseUnits("1", 18);
			const DEPOSIT_AMOUNT_2: BigNumber = ethers.utils.parseUnits("1", 18);


			it("Should receive strategy tokens based on what market value is (denominated in ETH)..", async () => {
				// Approve the SI to spend Mock A on behalf of owner
				await mockERC20A.approve(eRC20Handler.address, DEPOSIT_AMOUNT);

				// DEPOSIT - ERC20 tokens into the strategy
				await strategy.utilizedERC20Deposit([DEPOSIT_AMOUNT])

				let BalanceStrategyOwner = await strategy.eMP_shares(owner.address);

				const provider = await ethers.getContractAt(
					"MockERC20ETHValueProvider",
					await registry.eRC20_eRC20ETHValueProvider(mockERC20A.address)
				);

				// Get the ETH value of each tokens in ETH
				let ethValueMockA: BigNumber = await provider.utilizedERC20ETHValue();

				// [calculate] Deposit ETH Value
				let totalEthValue: BigNumber = DEPOSIT_AMOUNT.mul(ethValueMockA).div(D_18);

				// Expect that that amount of S tokens received
				expect(BalanceStrategyOwner).to.be.equal(totalEthValue);

				// [PRICE-UPDATE] Update Ether value of MockERC20A
				await eTHValueProvider.updateETHValue(ethers.utils.parseUnits("2", 18));

				// APPROVE - SI contract to spend tokens on behalf of owner
				await mockERC20A.approve(eRC20Handler.address, DEPOSIT_AMOUNT_2);

				// DEPOSIT - ERC20 tokens into the strategy
				await strategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_2])

				BalanceStrategyOwner = await strategy.eMP_shares(owner.address);

				expect(BalanceStrategyOwner).to.be.equal(ethers.utils.parseUnits("3", 18));

				// Get the ETH value of each tokens in ETH
				ethValueMockA = await provider.utilizedERC20ETHValue();

				let totalDeposited: BigNumber = DEPOSIT_AMOUNT.add(DEPOSIT_AMOUNT_2);

				// [calculate] Deposit ETH Value
				totalEthValue = totalDeposited.mul(ethValueMockA).div(D_18);

				expect(totalEthValue).to.be.equal(ethers.utils.parseUnits("4", 18));
			});
		});

		describe("function utilizedERC20Withdraw()", async () => {
			it("Should return same amount of ERC20 even if value of ERC20 changes..", async () => {
				const B4_BALANCE_MOCK_A_SI: BigNumber = await mockERC20A.balanceOf(eRC20Handler.address);
				const B4_BALANCE_MOCK_A_OWNER: BigNumber = await mockERC20A.balanceOf(owner.address);
				const DEPOSIT_AMOUNT_A: BigNumber = ethers.utils.parseUnits("1", 18);
				const B4_TOTAL_SUPPLY_STRATEGY: BigNumber = await strategy.sharesTotal();

				// APPROVE - SI contract to spend tokens on behalf of owner
				await mockERC20A.approve(eRC20Handler.address, DEPOSIT_AMOUNT_A);

				// DEPOSIT - ERC20 tokens into the strategy
				await strategy.utilizedERC20Deposit([DEPOSIT_AMOUNT_A])

				// [main-test] Withdraw ERC20 tokens into the strategy
				await strategy.utilizedERC20Withdraw(await strategy.eMP_shares(owner.address));

				// [PRICE-UPDATE] Update Ether value of MockERC20A
				await eTHValueProvider.updateETHValue(ethers.utils.parseUnits("2", 18));

				// Strategy token burned
				expect(await strategy.eMP_shares(owner.address)).to.be.equal(B4_BALANCE_MOCK_A_SI);

				// Supply put back to original
				expect(await strategy.sharesTotal()).to.be.equal(B4_TOTAL_SUPPLY_STRATEGY);

				// Expect that the balance been returned to original or greater
				expect(await mockERC20A.balanceOf(owner.address)).to.be.equal(B4_BALANCE_MOCK_A_OWNER);
			});
		});
	});

	describe("Strategy that accepts ERC20 A and ERC20 B but returns ERC20 C", async () => {
		beforeEach(async () => {
			await strategy.utilizedERC20DepositOpenUpdate(false);

			expect(await strategy.utilizedERC20DepositOpen()).to.be.false;

			await strategy.utilizedERC20WithdrawOpenUpdate(false);

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.false;

			// Set strategy ERC20 tokens
			await strategy.utilizedERC20Update(
				[mockERC20A.address, mockERC20B.address, mockERC20C.address],
				[[true, false, PERCENT.FIFTY], [true, false, PERCENT.FIFTY], [false, false, PERCENT.ZERO]],
			);

			await strategy.utilizedERC20DepositOpenUpdate(true);

			expect(await strategy.utilizedERC20DepositOpen()).to.be.true;

			await strategy.utilizedERC20WithdrawOpenUpdate(true);

			expect(await strategy.utilizedERC20WithdrawOpen()).to.be.true;
		});

		it("Should fail to return C if withdraw is not set to true..", async () => {
			// Give ERC20C to ERC20 Handler to mock rewards accrual
			await mockERC20C.connect(owner).transfer(eRC20Handler.address, ethers.utils.parseUnits("1", 6));

			const UTILIZED_ERC20: string[] = await strategy.utilizedERC20();

			const DEPOSIT_AMOUNTS: BigNumber[] = await utilStrategyTransfer.calculateERC20Required(
				ethers.utils.parseUnits("1", 18)
			);

			expect(DEPOSIT_AMOUNTS.length).to.be.equal(UTILIZED_ERC20.length);

			// Capture balances
			const B4_TOTAL_SUPPLY_STRATEGY: BigNumber = await strategy.sharesTotal();

			const B4_BALANCE_MOCK_C_OWNER: BigNumber = await mockERC20C.balanceOf(owner.address);

			let b4BalancesOwner: BigNumber[] = [];
			let b4BalancesERC20Handler: BigNumber[] = [];

			for (let i: number = 0; i < UTILIZED_ERC20.length; i++)
			{
				const IERC20 = await ethers.getContractAt(
					"@openzeppelin/contracts/token/ERC20/IERC20.sol:IERC20",
					UTILIZED_ERC20[i]
				);

				// APPROVE - SI contract to spend tokens on behalf of owner
				await IERC20.approve(eRC20Handler.address, DEPOSIT_AMOUNTS[i]);

				// Collect previous balances to check later with
				b4BalancesOwner.push(await IERC20.balanceOf(owner.address));
				b4BalancesERC20Handler.push(await IERC20.balanceOf(eRC20Handler.address));
			}

			// DEPOSIT - ERC20 A and ERC20 B tokens into the strategy
			await strategy.utilizedERC20Deposit(DEPOSIT_AMOUNTS);

			for (let i: number = 0; i < UTILIZED_ERC20.length; i++)
			{
				const IERC20 = await ethers.getContractAt(LOCATION_IERC20, UTILIZED_ERC20[i]);

				// Expect balance of owner
				expect(await IERC20.balanceOf(owner.address)).to.equal(b4BalancesOwner[i].sub(DEPOSIT_AMOUNTS[i]));

				// Expect balance of erc20 handler
				expect(await IERC20.balanceOf(eRC20Handler.address)).to.equal(
					b4BalancesERC20Handler[i].add(DEPOSIT_AMOUNTS[i])
				);
			}

			// [main-test] Withdraw ERC20 tokens into the strategy
			await strategy.utilizedERC20Withdraw(await strategy.eMP_shares(owner.address));

			// Supply put back to original
			expect(await strategy.sharesTotal()).to.be.equal(B4_TOTAL_SUPPLY_STRATEGY);

			expect(await mockERC20C.balanceOf(owner.address)).to.equal(B4_BALANCE_MOCK_C_OWNER);
		});
	});
});
