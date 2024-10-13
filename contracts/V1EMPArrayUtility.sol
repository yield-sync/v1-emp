// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;


import { IV1EMPArrayUtility } from "./interface/IV1EMPArrayUtility.sol";


contract V1EMPArrayUtility is
	IV1EMPArrayUtility
{
	address[] internal _uniqueAddresses;

	bool public override duplicateFound;

	mapping(address => bool) public seen;


	constructor ()
	{
		duplicateFound = false;
	}


	function _quickSort(address[] memory _array, uint256 _left, uint256 _right)
		internal
		pure
	{
		uint256 i = _left;
		uint256 j = _right;

		if(i == j)
		{
			return;
		}

		address pivot = _array[uint256(_left + (_right - _left) / 2)];

		while (i <= j)
		{
			while (_array[uint256(i)] < pivot)
			{
				i++;

				if (i > _right)
				{
					break;
				}
			}

			while (pivot < _array[uint256(j)])
			{
				if (j == _left)
				{
					break;
				}

				j--;
			}

			if (i <= j)
			{
				(_array[uint256(i)], _array[uint256(j)]) = (_array[uint256(j)], _array[uint256(i)]);
				i++;

				if (i > _right)
				{
					break;
				}

				if (j == _left)
				{
					break;
				}

				j--;
			}
		}

		if (_left < j)
		{
			_quickSort(_array, _left, j);
		}

		if (i < _right)
		{
			_quickSort(_array, i, _right);
		}
	}


	/// @inheritdoc IV1EMPArrayUtility
	function sort(address[] memory _array)
		public
		pure
		override
		returns (address[] memory)
	{
		_quickSort(_array, 0, uint256(_array.length - 1));

		return _array;
	}


	/// @inheritdoc IV1EMPArrayUtility
	function containsDuplicates(address[] memory _array)
		public
		override
		returns (bool)
	{
		duplicateFound = false;

		for (uint256 i = 0; i < _array.length; i++)
		{
			if (!seen[_array[i]])
			{
				seen[_array[i]] = true;
			}
			else
			{
				duplicateFound = true;

				break;
			}
		}

		for (uint256 i = 0; i < _array.length; i++)
		{
			seen[_array[i]] = false;
		}

		return duplicateFound;
	}

	/// @inheritdoc IV1EMPArrayUtility
	function removeDuplicates(address[] memory _array)
		public
		override
		returns (address[] memory)
	{
		delete _uniqueAddresses;

		for (uint256 i = 0; i < _array.length; i++)
		{
			if (!seen[_array[i]])
			{
				seen[_array[i]] = true;

				_uniqueAddresses.push(_array[i]);
			}
		}

		for (uint256 i = 0; i < _uniqueAddresses.length; i++)
		{
			seen[_uniqueAddresses[i]] = false;
		}

		return _uniqueAddresses;
	}
}
