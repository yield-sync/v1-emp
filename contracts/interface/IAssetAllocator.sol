// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;


interface IAssetAllocator
{
	function allocate(address strategy)
		external
	;

	function deallocate(address strategy)
		external
	;

	function withdrawalRequestCreate()
		external
	;
}
