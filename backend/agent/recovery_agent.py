"""
RecoveryAgent - Extends DigitalExecutor to search unclaimed property databases
Proactively searches for unclaimed assets and helps beneficiaries claim them
"""

import logging
import re
import json
from typing import Dict, Any, Optional, List
from datetime import datetime
from pathlib import Path

from agent.executor import DigitalExecutor
from services.websocket_manager import websocket_manager

logger = logging.getLogger(__name__)


class RecoveryAgent(DigitalExecutor):
    """
    Recovery agent that extends DigitalExecutor to search unclaimed property databases
    and help beneficiaries claim assets
    """

    def __init__(self):
        """Initialize the RecoveryAgent"""
        super().__init__()
        self.claims_dir = Path(__file__).parent.parent / "claims"
        self.claims_dir.mkdir(parents=True, exist_ok=True)

    async def search_missing_money(
        self,
        name: str,
        ssn: Optional[str] = None,
        last_address: Optional[str] = None,
        execution_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Search MissingMoney.com for unclaimed property

        Args:
            name: Full name of the deceased
            ssn: Social Security Number (optional, for verification)
            last_address: Last known address
            execution_id: Optional execution ID for WebSocket tracking

        Returns:
            Dictionary containing:
                - success: Boolean
                - results: List of found assets
                - claim_forms: List of downloaded claim form paths
        """
        if execution_id is None:
            execution_id = f"recovery_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        await self._emit_event(
            execution_id,
            "recovery_started",
            {
                "source": "MissingMoney.com",
                "name": name,
                "timestamp": datetime.now().isoformat(),
            },
        )

        # Build search task description
        task_description = f"""
Search for unclaimed property on MissingMoney.com for:
- Name: {name}
- Last Known Address: {last_address or "Not provided"}
- SSN: {"Provided" if ssn else "Not provided"}

Steps:
1. Navigate to https://www.missingmoney.com
2. Find the search form on the homepage
3. Enter the name: {name}
4. If there's an address field, enter: {last_address or "leave blank"}
5. Submit the search form
6. Wait for results to load
7. Parse all search results and extract:
   - Property type (bank account, insurance, etc.)
   - Property holder name
   - Property value (if shown)
   - State where property is held
   - Claim ID or reference number
   - Link to claim form
8. For each result found:
   - Click on the result to view details
   - Look for a "Download Claim Form" or "Print Claim Form" button
   - Download the claim form PDF
   - Save it with a descriptive filename
9. Return a summary of all found assets with their estimated values

Important: Extract as much detail as possible from each result. If values are not shown, estimate based on property type.
"""

        try:
            await self._emit_event(
                execution_id,
                "step",
                {
                    "step": "Searching MissingMoney.com",
                    "status": "in_progress",
                    "source": "MissingMoney.com",
                },
            )

            # Execute the search task
            result = await self.run_task(
                task_description=task_description,
                session_data={"url": "https://www.missingmoney.com"},
                execution_id=execution_id,
            )

            if not result.get("success"):
                return {
                    "success": False,
                    "results": [],
                    "claim_forms": [],
                    "error": result.get("error", "Search failed"),
                }

            # Parse results from output
            output = result.get("output", "")
            parsed_results = self._parse_missing_money_results(output, name)

            # Find downloaded claim forms
            claim_forms = self._find_claim_forms(execution_id)

            await self._emit_event(
                execution_id,
                "recovery_completed",
                {
                    "source": "MissingMoney.com",
                    "results_count": len(parsed_results),
                    "forms_count": len(claim_forms),
                },
            )

            return {
                "success": True,
                "results": parsed_results,
                "claim_forms": claim_forms,
                "raw_output": output,
            }

        except Exception as e:
            logger.error(f"Error searching MissingMoney.com: {e}")
            await self._emit_event(
                execution_id,
                "error",
                {"error": str(e), "source": "MissingMoney.com"},
            )
            return {
                "success": False,
                "results": [],
                "claim_forms": [],
                "error": str(e),
            }

    async def search_naic_life_insurance(
        self,
        name: str,
        ssn: Optional[str] = None,
        last_address: Optional[str] = None,
        execution_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Search NAIC Life Insurance Policy Locator for unclaimed life insurance

        Args:
            name: Full name of the deceased
            ssn: Social Security Number (optional)
            last_address: Last known address
            execution_id: Optional execution ID for WebSocket tracking

        Returns:
            Dictionary containing search results
        """
        if execution_id is None:
            execution_id = f"recovery_naic_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        await self._emit_event(
            execution_id,
            "recovery_started",
            {
                "source": "NAIC Life Insurance Policy Locator",
                "name": name,
                "timestamp": datetime.now().isoformat(),
            },
        )

        task_description = f"""
Search for unclaimed life insurance policies on the NAIC Life Insurance Policy Locator:
- Name: {name}
- Last Known Address: {last_address or "Not provided"}
- SSN: {"Provided" if ssn else "Not provided"}

Steps:
1. Navigate to https://eapps.naic.org/life-policy-locator/
2. Find the search form
3. Enter the deceased's information:
   - First Name: {name.split()[0] if name else ""}
   - Last Name: {name.split()[-1] if name else ""}
   - Date of Birth: (if available in records)
   - SSN: {ssn or "leave blank if not provided"}
   - Last Known Address: {last_address or "leave blank"}
4. Submit the search
5. Wait for results
6. Parse any matching policies found:
   - Insurance company name
   - Policy number (if shown)
   - Policy type
   - Estimated value (if available)
   - Contact information for the insurance company
7. Download any claim forms or instructions provided
8. Return a summary of findings

Note: NAIC may require additional verification. Extract all available information.
"""

        try:
            await self._emit_event(
                execution_id,
                "step",
                {
                    "step": "Searching NAIC Life Insurance Policy Locator",
                    "status": "in_progress",
                    "source": "NAIC",
                },
            )

            result = await self.run_task(
                task_description=task_description,
                session_data={"url": "https://eapps.naic.org/life-policy-locator/"},
                execution_id=execution_id,
            )

            if not result.get("success"):
                return {
                    "success": False,
                    "results": [],
                    "claim_forms": [],
                    "error": result.get("error", "Search failed"),
                }

            output = result.get("output", "")
            parsed_results = self._parse_naic_results(output, name)
            claim_forms = self._find_claim_forms(execution_id)

            await self._emit_event(
                execution_id,
                "recovery_completed",
                {
                    "source": "NAIC",
                    "results_count": len(parsed_results),
                    "forms_count": len(claim_forms),
                },
            )

            return {
                "success": True,
                "results": parsed_results,
                "claim_forms": claim_forms,
                "raw_output": output,
            }

        except Exception as e:
            logger.error(f"Error searching NAIC: {e}")
            await self._emit_event(
                execution_id, "error", {"error": str(e), "source": "NAIC"}
            )
            return {
                "success": False,
                "results": [],
                "claim_forms": [],
                "error": str(e),
            }

    async def search_treasury_hunt(
        self,
        name: str,
        ssn: Optional[str] = None,
        last_address: Optional[str] = None,
        execution_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Search Treasury Hunt for unclaimed bonds and securities

        Args:
            name: Full name of the deceased
            ssn: Social Security Number (optional)
            last_address: Last known address
            execution_id: Optional execution ID for WebSocket tracking

        Returns:
            Dictionary containing search results
        """
        if execution_id is None:
            execution_id = f"recovery_treasury_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        await self._emit_event(
            execution_id,
            "recovery_started",
            {
                "source": "Treasury Hunt",
                "name": name,
                "timestamp": datetime.now().isoformat(),
            },
        )

        task_description = f"""
Search for unclaimed bonds and securities on Treasury Hunt:
- Name: {name}
- Last Known Address: {last_address or "Not provided"}
- SSN: {"Provided" if ssn else "Not provided"}

Steps:
1. Navigate to https://www.treasuryhunt.gov/
2. Find the search form
3. Enter search criteria:
   - Name: {name}
   - SSN: {ssn or "leave blank if not provided"}
   - Address: {last_address or "leave blank"}
4. Submit the search
5. Review results for:
   - Bond serial numbers
   - Bond types (Series E, Series EE, etc.)
   - Face values
   - Maturity dates
   - Current estimated values
6. Download any claim forms or instructions
7. Return a summary of all unclaimed bonds found

Note: Treasury bonds may have significant value, especially if held for many years.
"""

        try:
            await self._emit_event(
                execution_id,
                "step",
                {
                    "step": "Searching Treasury Hunt",
                    "status": "in_progress",
                    "source": "Treasury Hunt",
                },
            )

            result = await self.run_task(
                task_description=task_description,
                session_data={"url": "https://www.treasuryhunt.gov/"},
                execution_id=execution_id,
            )

            if not result.get("success"):
                return {
                    "success": False,
                    "results": [],
                    "claim_forms": [],
                    "error": result.get("error", "Search failed"),
                }

            output = result.get("output", "")
            parsed_results = self._parse_treasury_results(output, name)
            claim_forms = self._find_claim_forms(execution_id)

            await self._emit_event(
                execution_id,
                "recovery_completed",
                {
                    "source": "Treasury Hunt",
                    "results_count": len(parsed_results),
                    "forms_count": len(claim_forms),
                },
            )

            return {
                "success": True,
                "results": parsed_results,
                "claim_forms": claim_forms,
                "raw_output": output,
            }

        except Exception as e:
            logger.error(f"Error searching Treasury Hunt: {e}")
            await self._emit_event(
                execution_id, "error", {"error": str(e), "source": "Treasury Hunt"}
            )
            return {
                "success": False,
                "results": [],
                "claim_forms": [],
                "error": str(e),
            }

    async def search_all_sources(
        self,
        name: str,
        ssn: Optional[str] = None,
        last_address: Optional[str] = None,
        execution_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Search all unclaimed property sources

        Args:
            name: Full name of the deceased
            ssn: Social Security Number (optional)
            last_address: Last known address
            execution_id: Optional execution ID for WebSocket tracking

        Returns:
            Combined results from all sources
        """
        if execution_id is None:
            execution_id = f"recovery_all_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        all_results = {
            "success": True,
            "sources": {},
            "total_assets": [],
            "total_estimated_value": 0.0,
            "claim_forms": [],
        }

        # Search MissingMoney.com
        missing_money_result = await self.search_missing_money(
            name, ssn, last_address, f"{execution_id}_missingmoney"
        )
        all_results["sources"]["missingmoney"] = missing_money_result
        if missing_money_result.get("success"):
            all_results["total_assets"].extend(missing_money_result.get("results", []))
            all_results["claim_forms"].extend(
                missing_money_result.get("claim_forms", [])
            )

        # Search NAIC
        naic_result = await self.search_naic_life_insurance(
            name, ssn, last_address, f"{execution_id}_naic"
        )
        all_results["sources"]["naic"] = naic_result
        if naic_result.get("success"):
            all_results["total_assets"].extend(naic_result.get("results", []))
            all_results["claim_forms"].extend(naic_result.get("claim_forms", []))

        # Search Treasury Hunt
        treasury_result = await self.search_treasury_hunt(
            name, ssn, last_address, f"{execution_id}_treasury"
        )
        all_results["sources"]["treasury"] = treasury_result
        if treasury_result.get("success"):
            all_results["total_assets"].extend(treasury_result.get("results", []))
            all_results["claim_forms"].extend(treasury_result.get("claim_forms", []))

        # Calculate total estimated value
        for asset in all_results["total_assets"]:
            value = asset.get("estimated_value", 0)
            if isinstance(value, (int, float)):
                all_results["total_estimated_value"] += value
            elif isinstance(value, str):
                # Try to extract number from string like "$1,234.56"
                numeric_value = re.sub(r"[^\d.]", "", value)
                try:
                    all_results["total_estimated_value"] += float(numeric_value)
                except ValueError:
                    pass

        return all_results

    async def prefill_claim_form(
        self,
        form_path: str,
        beneficiary_data: Dict[str, Any],
        execution_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Pre-fill a claim form using beneficiary data from the vault

        Args:
            form_path: Path to the claim form PDF
            beneficiary_data: Dictionary containing beneficiary information:
                - name: Full name
                - address: Address
                - phone: Phone number
                - email: Email address
                - relationship: Relationship to deceased
                - ssn: Social Security Number (if needed)
            execution_id: Optional execution ID for WebSocket tracking

        Returns:
            Dictionary with pre-filled form path
        """
        if execution_id is None:
            execution_id = f"prefill_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        await self._emit_event(
            execution_id,
            "prefill_started",
            {
                "form_path": form_path,
                "timestamp": datetime.now().isoformat(),
            },
        )

        task_description = f"""
Pre-fill the claim form located at: {form_path}

Use the following beneficiary information:
- Name: {beneficiary_data.get('name', 'N/A')}
- Address: {beneficiary_data.get('address', 'N/A')}
- Phone: {beneficiary_data.get('phone', 'N/A')}
- Email: {beneficiary_data.get('email', 'N/A')}
- Relationship to Deceased: {beneficiary_data.get('relationship', 'N/A')}
- SSN: {"Provided" if beneficiary_data.get('ssn') else "Not provided"}

Steps:
1. Open the PDF form at {form_path}
2. Fill in all fields with the beneficiary information above
3. Leave fields blank if information is not available
4. Save the pre-filled form with a new filename (add "_prefilled" suffix)
5. Return the path to the pre-filled form

Important: Only fill fields that match the provided information. Do not guess or make up information.
"""

        try:
            result = await self.run_task(
                task_description=task_description,
                execution_id=execution_id,
            )

            if result.get("success"):
                await self._emit_event(
                    execution_id,
                    "prefill_completed",
                    {"form_path": form_path},
                )
                return {
                    "success": True,
                    "prefilled_form_path": form_path.replace(
                        ".pdf", "_prefilled.pdf"
                    ),
                }
            else:
                return {
                    "success": False,
                    "error": result.get("error", "Pre-fill failed"),
                }

        except Exception as e:
            logger.error(f"Error pre-filling form: {e}")
            return {"success": False, "error": str(e)}

    def _parse_missing_money_results(
        self, output: str, name: str
    ) -> List[Dict[str, Any]]:
        """Parse search results from MissingMoney.com output"""
        results = []

        # Try to extract structured data from the output
        # Look for patterns indicating results
        lines = output.split("\n")

        current_result = None
        for line in lines:
            line = line.strip()

            # Look for property type indicators
            if any(
                keyword in line.lower()
                for keyword in [
                    "bank account",
                    "insurance",
                    "dividend",
                    "wage",
                    "utility",
                    "property",
                    "asset",
                ]
            ):
                if current_result:
                    results.append(current_result)
                current_result = {
                    "source": "MissingMoney.com",
                    "property_type": line,
                    "holder_name": name,
                    "estimated_value": None,
                    "state": None,
                    "claim_id": None,
                }

            # Look for dollar amounts
            dollar_match = re.search(r"\$[\d,]+\.?\d*", line)
            if dollar_match and current_result:
                value_str = dollar_match.group(0)
                numeric_value = re.sub(r"[^\d.]", "", value_str)
                try:
                    current_result["estimated_value"] = float(numeric_value)
                except ValueError:
                    current_result["estimated_value"] = value_str

            # Look for state abbreviations
            state_match = re.search(
                r"\b([A-Z]{2})\b", line
            )  # Simple state abbreviation pattern
            if state_match and current_result:
                state = state_match.group(1)
                if state not in ["AM", "PM", "ID", "IT"]:  # Filter out common false positives
                    current_result["state"] = state

            # Look for claim IDs or reference numbers
            id_match = re.search(r"(?:claim|ref|id)[\s:]*([A-Z0-9-]+)", line, re.I)
            if id_match and current_result:
                current_result["claim_id"] = id_match.group(1)

        if current_result:
            results.append(current_result)

        # If no structured results found, create a summary result
        if not results:
            # Check if output indicates no results
            if any(
                keyword in output.lower()
                for keyword in ["no results", "not found", "no matches"]
            ):
                return []
            else:
                # Create a generic result indicating something was found
                results.append(
                    {
                        "source": "MissingMoney.com",
                        "property_type": "Unclaimed Property",
                        "holder_name": name,
                        "estimated_value": None,
                        "state": None,
                        "claim_id": None,
                        "note": "Results found but details need manual review",
                    }
                )

        return results

    def _parse_naic_results(self, output: str, name: str) -> List[Dict[str, Any]]:
        """Parse search results from NAIC Life Insurance Policy Locator"""
        results = []

        lines = output.split("\n")
        current_result = None

        for line in lines:
            line = line.strip()

            # Look for insurance company names
            if "insurance" in line.lower() or "company" in line.lower():
                if current_result:
                    results.append(current_result)
                current_result = {
                    "source": "NAIC Life Insurance Policy Locator",
                    "property_type": "Life Insurance Policy",
                    "holder_name": name,
                    "insurance_company": line,
                    "policy_number": None,
                    "estimated_value": None,
                    "contact_info": None,
                }

            # Look for policy numbers
            policy_match = re.search(r"policy[\s#:]*([A-Z0-9-]+)", line, re.I)
            if policy_match and current_result:
                current_result["policy_number"] = policy_match.group(1)

            # Look for dollar amounts
            dollar_match = re.search(r"\$[\d,]+\.?\d*", line)
            if dollar_match and current_result:
                value_str = dollar_match.group(0)
                numeric_value = re.sub(r"[^\d.]", "", value_str)
                try:
                    current_result["estimated_value"] = float(numeric_value)
                except ValueError:
                    current_result["estimated_value"] = value_str

        if current_result:
            results.append(current_result)

        if not results:
            if any(
                keyword in output.lower()
                for keyword in ["no results", "not found", "no matches"]
            ):
                return []
            else:
                results.append(
                    {
                        "source": "NAIC Life Insurance Policy Locator",
                        "property_type": "Life Insurance Policy",
                        "holder_name": name,
                        "estimated_value": None,
                        "note": "Results found but details need manual review",
                    }
                )

        return results

    def _parse_treasury_results(self, output: str, name: str) -> List[Dict[str, Any]]:
        """Parse search results from Treasury Hunt"""
        results = []

        lines = output.split("\n")
        current_result = None

        for line in lines:
            line = line.strip()

            # Look for bond types
            if any(
                keyword in line.lower()
                for keyword in ["series e", "series ee", "bond", "treasury"]
            ):
                if current_result:
                    results.append(current_result)
                current_result = {
                    "source": "Treasury Hunt",
                    "property_type": "Treasury Bond",
                    "holder_name": name,
                    "bond_type": None,
                    "serial_number": None,
                    "face_value": None,
                    "estimated_value": None,
                    "maturity_date": None,
                }

                # Extract bond type
                if "series e" in line.lower():
                    current_result["bond_type"] = "Series E"
                elif "series ee" in line.lower():
                    current_result["bond_type"] = "Series EE"

            # Look for serial numbers
            serial_match = re.search(
                r"(?:serial|s/n)[\s#:]*([A-Z0-9-]+)", line, re.I
            )
            if serial_match and current_result:
                current_result["serial_number"] = serial_match.group(1)

            # Look for dollar amounts
            dollar_match = re.search(r"\$[\d,]+\.?\d*", line)
            if dollar_match and current_result:
                value_str = dollar_match.group(0)
                numeric_value = re.sub(r"[^\d.]", "", value_str)
                try:
                    value = float(numeric_value)
                    if not current_result.get("face_value"):
                        current_result["face_value"] = value
                    current_result["estimated_value"] = value
                except ValueError:
                    pass

            # Look for dates (maturity dates)
            date_match = re.search(
                r"(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})", line
            )
            if date_match and current_result:
                current_result["maturity_date"] = date_match.group(1)

        if current_result:
            results.append(current_result)

        if not results:
            if any(
                keyword in output.lower()
                for keyword in ["no results", "not found", "no matches"]
            ):
                return []
            else:
                results.append(
                    {
                        "source": "Treasury Hunt",
                        "property_type": "Treasury Bond",
                        "holder_name": name,
                        "estimated_value": None,
                        "note": "Results found but details need manual review",
                    }
                )

        return results

    def _find_claim_forms(self, execution_id: str) -> List[str]:
        """Find downloaded claim forms for an execution"""
        forms = []

        # Check screenshots directory (forms might be saved there)
        screenshots_dir = Path(__file__).parent.parent / "screenshots" / execution_id
        if screenshots_dir.exists():
            for file in screenshots_dir.glob("*.pdf"):
                forms.append(str(file))

        # Check claims directory
        if self.claims_dir.exists():
            for file in self.claims_dir.glob(f"{execution_id}*.pdf"):
                forms.append(str(file))

        return forms

    async def _emit_event(
        self, execution_id: str, event_type: str, data: Dict[str, Any]
    ):
        """Emit a WebSocket event"""
        try:
            message = {
                "type": event_type,
                "execution_id": execution_id,
                "data": data,
                "timestamp": datetime.now().isoformat(),
            }
            await websocket_manager.send_to_execution(execution_id, message)
        except Exception as e:
            logger.error(f"Error emitting WebSocket event: {e}")


# Global recovery agent instance
recovery_agent = RecoveryAgent()

