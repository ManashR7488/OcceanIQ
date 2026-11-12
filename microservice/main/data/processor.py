"""
Data file processor for CSV, JSON, XML, and netCDF formats
Handles parsing, chunking, and text generation for embeddings
"""
import io
import json
import pandas as pd
import xmltodict
from typing import Dict, List, Optional, Tuple
from datetime import datetime
import os


class DataProcessor:
    """Processes uploaded data files for vector storage"""
    
    def __init__(self):
        self.max_file_size_mb = int(os.environ.get("MAX_FILE_SIZE_MB", "50"))
        self.chunk_size_csv = int(os.environ.get("CHUNK_SIZE_CSV", "50"))
        self.chunk_size_json = int(os.environ.get("CHUNK_SIZE_JSON", "100"))
        self.chunk_size_xml = int(os.environ.get("CHUNK_SIZE_XML", "50"))
        self.chunk_size_netcdf = int(os.environ.get("CHUNK_SIZE_NETCDF", "10"))
    
    def detect_file_format(self, filename: str, content: bytes) -> str:
        """
        Detect file format from filename and content
        
        Args:
            filename: Original filename
            content: File content bytes
            
        Returns:
            File format: 'CSV', 'JSON', 'XML', 'netCDF'
            
        Raises:
            ValueError: If format is unsupported
        """
        # Check by extension first
        ext = filename.lower().split('.')[-1]
        
        if ext == 'csv':
            return 'CSV'
        elif ext == 'json':
            return 'JSON'
        elif ext == 'xml':
            return 'XML'
        elif ext in ['nc', 'netcdf', 'nc4']:
            # Check magic bytes for netCDF
            if content[:3] == b'CDF' or content[:4] == b'\x89HDF':
                return 'netCDF'
        
        # Try to detect from content
        try:
            content_str = content[:1000].decode('utf-8', errors='ignore')
            if content_str.strip().startswith('{') or content_str.strip().startswith('['):
                return 'JSON'
            elif content_str.strip().startswith('<?xml') or content_str.strip().startswith('<'):
                return 'XML'
        except:
            pass
        
        raise ValueError(f"Unsupported file format: {ext}")
    
    def validate_file(self, content: bytes, filename: str) -> None:
        """
        Validate file size and basic structure
        
        Args:
            content: File content bytes
            filename: Original filename
            
        Raises:
            ValueError: If validation fails
        """
        # Check file size
        size_mb = len(content) / (1024 * 1024)
        if size_mb > self.max_file_size_mb:
            raise ValueError(f"File size {size_mb:.2f}MB exceeds maximum {self.max_file_size_mb}MB")
        
        # Check non-empty
        if len(content) == 0:
            raise ValueError("File is empty")
    
    async def parse_file(self, file_content: bytes, filename: str, file_format: str) -> Dict:
        """
        Parse file content based on format
        
        Args:
            file_content: Raw file bytes
            filename: Original filename
            file_format: Detected format (CSV/JSON/XML/netCDF)
            
        Returns:
            Parsed data dictionary
        """
        print(f"[Processor] Parsing {file_format} file: {filename}")
        start_time = datetime.now()
        
        try:
            if file_format == 'CSV':
                data = await self._parse_csv(file_content)
            elif file_format == 'JSON':
                data = await self._parse_json(file_content)
            elif file_format == 'XML':
                data = await self._parse_xml(file_content)
            elif file_format == 'netCDF':
                data = await self._parse_netcdf(file_content, filename)
            else:
                raise ValueError(f"Unsupported format: {file_format}")
            
            elapsed = (datetime.now() - start_time).total_seconds()
            print(f"[Processor] Parsed in {elapsed:.2f}s")
            return data
        except Exception as e:
            print(f"[Processor] Parse error: {str(e)}")
            raise ValueError(f"Failed to parse {file_format} file: {str(e)}")
    
    async def _parse_csv(self, content: bytes) -> Dict:
        """Parse CSV file using pandas"""
        try:
            df = pd.read_csv(io.BytesIO(content))
            
            if df.empty:
                raise ValueError("CSV file contains no data")
            
            return {
                "format": "CSV",
                "dataframe": df,
                "columns": df.columns.tolist(),
                "row_count": len(df),
                "dtypes": df.dtypes.to_dict()
            }
        except Exception as e:
            raise ValueError(f"CSV parsing error: {str(e)}")
    
    async def _parse_json(self, content: bytes) -> Dict:
        """Parse JSON file"""
        try:
            data = json.loads(content.decode('utf-8'))
            
            # Handle array or single object
            if isinstance(data, list):
                records = data
            elif isinstance(data, dict):
                # Try to find array within object
                records = None
                for key, value in data.items():
                    if isinstance(value, list):
                        records = value
                        break
                if records is None:
                    records = [data]
            else:
                raise ValueError("JSON must be object or array")
            
            return {
                "format": "JSON",
                "records": records,
                "record_count": len(records),
                "keys": list(records[0].keys()) if records and isinstance(records[0], dict) else []
            }
        except json.JSONDecodeError as e:
            raise ValueError(f"Invalid JSON: {str(e)}")
    
    async def _parse_xml(self, content: bytes) -> Dict:
        """Parse XML file"""
        try:
            data = xmltodict.parse(content)
            
            # Extract root element and records
            root_key = list(data.keys())[0] if data else None
            root_data = data.get(root_key, {})
            
            # Try to find repeating elements (records)
            records = []
            for key, value in root_data.items():
                if isinstance(value, list):
                    records = value
                    break
            
            if not records and isinstance(root_data, dict):
                records = [root_data]
            
            return {
                "format": "XML",
                "root_element": root_key,
                "records": records,
                "record_count": len(records)
            }
        except Exception as e:
            raise ValueError(f"XML parsing error: {str(e)}")
    
    async def _parse_netcdf(self, content: bytes, filename: str) -> Dict:
        """Parse netCDF file"""
        try:
            import netCDF4
            import tempfile
            
            # Write to temp file (netCDF4 requires file path)
            with tempfile.NamedTemporaryFile(delete=False, suffix='.nc') as tmp:
                tmp.write(content)
                tmp_path = tmp.name
            
            try:
                dataset = netCDF4.Dataset(tmp_path, 'r')
                
                # Extract variables and dimensions
                variables = {}
                for var_name in dataset.variables:
                    var = dataset.variables[var_name]
                    variables[var_name] = {
                        "dimensions": var.dimensions,
                        "shape": var.shape,
                        "dtype": str(var.dtype),
                        "units": getattr(var, 'units', 'unknown')
                    }
                
                # Extract global attributes
                global_attrs = {attr: getattr(dataset, attr) for attr in dataset.ncattrs()}
                
                # Get time dimension if exists
                time_var = None
                if 'time' in dataset.variables:
                    time_var = dataset.variables['time']
                
                # Compute dimensions before closing dataset
                dimensions_info = {dim: len(dataset.dimensions[dim]) for dim in dataset.dimensions}
                time_steps_count = len(time_var) if time_var else 0
                
                dataset.close()
                
                return {
                    "format": "netCDF",
                    "variables": variables,
                    "dimensions": dimensions_info,
                    "global_attributes": global_attrs,
                    "time_steps": time_steps_count
                }
            finally:
                os.unlink(tmp_path)
                
        except ImportError:
            raise ValueError("netCDF4 library not installed")
        except Exception as e:
            raise ValueError(f"netCDF parsing error: {str(e)}")
    
    def extract_metadata(self, parsed_data: Dict, file_format: str) -> Dict:
        """
        Extract metadata from parsed data
        
        Args:
            parsed_data: Output from parse_file
            file_format: File format
            
        Returns:
            Metadata dictionary
        """
        metadata = {"file_format": file_format}
        
        if file_format == 'CSV':
            df = parsed_data['dataframe']
            metadata.update({
                "columns": parsed_data['columns'],
                "row_count": parsed_data['row_count'],
                "data_types": {k: str(v) for k, v in parsed_data['dtypes'].items()},
                "summary_stats": {}
            })
            
            # Add summary stats for numeric columns
            numeric_cols = df.select_dtypes(include=['number']).columns
            for col in numeric_cols:
                try:
                    metadata["summary_stats"][col] = {
                        "mean": float(df[col].mean()),
                        "min": float(df[col].min()),
                        "max": float(df[col].max()),
                        "std": float(df[col].std())
                    }
                except:
                    pass
        
        elif file_format == 'JSON':
            metadata.update({
                "record_count": parsed_data['record_count'],
                "keys": parsed_data['keys']
            })
        
        elif file_format == 'XML':
            metadata.update({
                "root_element": parsed_data['root_element'],
                "record_count": parsed_data['record_count']
            })
        
        elif file_format == 'netCDF':
            # Convert global attributes to JSON-serializable format
            global_attrs = parsed_data.get('global_attributes', {})
            serializable_attrs = {}
            for key, value in global_attrs.items():
                try:
                    # Convert numpy types to Python types
                    import numpy as np
                    if isinstance(value, np.ndarray):
                        # Convert arrays to lists or strings if too large
                        if value.size <= 100:
                            serializable_attrs[key] = value.tolist()
                        else:
                            serializable_attrs[key] = f"<array of {value.size} elements>"
                    elif isinstance(value, (np.integer, np.floating)):
                        serializable_attrs[key] = value.item()
                    elif isinstance(value, (str, int, float, bool)):
                        serializable_attrs[key] = value
                    else:
                        serializable_attrs[key] = str(value)
                except:
                    serializable_attrs[key] = str(value)
            
            metadata.update({
                "variables": list(parsed_data['variables'].keys()),
                "dimensions": parsed_data['dimensions'],
                "time_steps": parsed_data.get('time_steps', 0),
                "global_attributes": serializable_attrs
            })
        
        return metadata
    
    async def chunk_data(self, parsed_data: Dict, file_format: str) -> List[Dict]:
        """
        Chunk data into semantically meaningful pieces
        
        Args:
            parsed_data: Output from parse_file
            file_format: File format
            
        Returns:
            List of chunk dictionaries with 'data' and 'metadata' keys
        """
        print(f"[Processor] Chunking {file_format} data")
        
        if file_format == 'CSV':
            return await self._chunk_csv(parsed_data)
        elif file_format == 'JSON':
            return await self._chunk_json(parsed_data)
        elif file_format == 'XML':
            return await self._chunk_xml(parsed_data)
        elif file_format == 'netCDF':
            return await self._chunk_netcdf(parsed_data)
        else:
            raise ValueError(f"Unsupported format: {file_format}")
    
    async def _chunk_csv(self, parsed_data: Dict) -> List[Dict]:
        """Chunk CSV data by rows"""
        df = parsed_data['dataframe']
        chunks = []
        chunk_size = self.chunk_size_csv
        
        for i in range(0, len(df), chunk_size):
            chunk_df = df.iloc[i:i+chunk_size]
            chunks.append({
                "data": chunk_df,
                "metadata": {
                    "start_row": i,
                    "end_row": min(i + chunk_size, len(df)),
                    "row_count": len(chunk_df)
                }
            })
        
        print(f"[Processor] Created {len(chunks)} CSV chunks")
        return chunks
    
    async def _chunk_json(self, parsed_data: Dict) -> List[Dict]:
        """Chunk JSON data by objects"""
        records = parsed_data['records']
        chunks = []
        chunk_size = self.chunk_size_json
        
        for i in range(0, len(records), chunk_size):
            chunk_records = records[i:i+chunk_size]
            chunks.append({
                "data": chunk_records,
                "metadata": {
                    "start_index": i,
                    "end_index": min(i + chunk_size, len(records)),
                    "record_count": len(chunk_records)
                }
            })
        
        print(f"[Processor] Created {len(chunks)} JSON chunks")
        return chunks
    
    async def _chunk_xml(self, parsed_data: Dict) -> List[Dict]:
        """Chunk XML data by elements"""
        records = parsed_data['records']
        chunks = []
        chunk_size = self.chunk_size_xml
        
        for i in range(0, len(records), chunk_size):
            chunk_records = records[i:i+chunk_size]
            chunks.append({
                "data": chunk_records,
                "metadata": {
                    "start_index": i,
                    "end_index": min(i + chunk_size, len(records)),
                    "record_count": len(chunk_records)
                }
            })
        
        print(f"[Processor] Created {len(chunks)} XML chunks")
        return chunks
    
    async def _chunk_netcdf(self, parsed_data: Dict) -> List[Dict]:
        """Chunk netCDF data by time steps"""
        # For netCDF, create descriptive chunks based on variables
        variables = parsed_data['variables']
        time_steps = parsed_data.get('time_steps', 1)
        chunks = []
        chunk_size = self.chunk_size_netcdf
        
        # If no time dimension, create single chunk
        if time_steps == 0:
            chunks.append({
                "data": variables,
                "metadata": {
                    "variables": list(variables.keys()),
                    "time_range": "static"
                }
            })
        else:
            # Chunk by time slices
            for i in range(0, time_steps, chunk_size):
                chunks.append({
                    "data": variables,
                    "metadata": {
                        "variables": list(variables.keys()),
                        "time_start": i,
                        "time_end": min(i + chunk_size, time_steps),
                        "time_steps": min(chunk_size, time_steps - i)
                    }
                })
        
        print(f"[Processor] Created {len(chunks)} netCDF chunks")
        return chunks
    
    def generate_chunk_text(self, chunk: Dict, metadata: Dict, file_format: str) -> str:
        """
        Generate descriptive text for chunk suitable for semantic search
        
        Args:
            chunk: Chunk dictionary from chunk_data
            metadata: File metadata from extract_metadata
            file_format: File format
            
        Returns:
            Natural language description of chunk
        """
        if file_format == 'CSV':
            return self._generate_csv_text(chunk, metadata)
        elif file_format == 'JSON':
            return self._generate_json_text(chunk, metadata)
        elif file_format == 'XML':
            return self._generate_xml_text(chunk, metadata)
        elif file_format == 'netCDF':
            return self._generate_netcdf_text(chunk, metadata)
        else:
            return "Unknown data format"
    
    def _generate_csv_text(self, chunk: Dict, metadata: Dict) -> str:
        """Generate text for CSV chunk"""
        df = chunk['data']
        chunk_meta = chunk['metadata']
        
        text_parts = []
        
        # Basic info
        text_parts.append(
            f"This dataset contains {chunk_meta['row_count']} rows "
            f"(rows {chunk_meta['start_row']+1} to {chunk_meta['end_row']}) "
            f"with columns: {', '.join(metadata['columns'])}."
        )
        
        # Sample values for key columns
        for col in df.columns[:5]:  # First 5 columns
            unique_values = df[col].dropna().unique()
            if len(unique_values) <= 10:
                text_parts.append(f"{col} values include: {', '.join(map(str, unique_values[:5]))}.")
            elif df[col].dtype in ['int64', 'float64']:
                text_parts.append(
                    f"{col} ranges from {df[col].min():.2f} to {df[col].max():.2f} "
                    f"(mean: {df[col].mean():.2f})."
                )
        
        # Geographic info if lat/lon columns exist
        lat_cols = [c for c in df.columns if 'lat' in c.lower()]
        lon_cols = [c for c in df.columns if 'lon' in c.lower()]
        if lat_cols and lon_cols:
            lat_col, lon_col = lat_cols[0], lon_cols[0]
            text_parts.append(
                f"Geographic coverage: {df[lat_col].min():.2f}°N to {df[lat_col].max():.2f}°N, "
                f"{df[lon_col].min():.2f}°E to {df[lon_col].max():.2f}°E."
            )
        
        return ' '.join(text_parts)
    
    def _generate_json_text(self, chunk: Dict, metadata: Dict) -> str:
        """Generate text for JSON chunk"""
        records = chunk['data']
        chunk_meta = chunk['metadata']
        
        text_parts = []
        text_parts.append(
            f"This JSON dataset contains {chunk_meta['record_count']} records "
            f"(records {chunk_meta['start_index']+1} to {chunk_meta['end_index']})."
        )
        
        if metadata.get('keys'):
            text_parts.append(f"Available fields: {', '.join(metadata['keys'])}.")
        
        # Sample first record
        if records and isinstance(records[0], dict):
            sample = records[0]
            text_parts.append(f"Sample data: {str(sample)[:200]}")
        
        return ' '.join(text_parts)
    
    def _generate_xml_text(self, chunk: Dict, metadata: Dict) -> str:
        """Generate text for XML chunk"""
        records = chunk['data']
        chunk_meta = chunk['metadata']
        
        text_parts = []
        text_parts.append(
            f"This XML dataset (root element: {metadata.get('root_element', 'unknown')}) "
            f"contains {chunk_meta['record_count']} elements "
            f"(elements {chunk_meta['start_index']+1} to {chunk_meta['end_index']})."
        )
        
        # Sample first record
        if records:
            text_parts.append(f"Sample element: {str(records[0])[:200]}")
        
        return ' '.join(text_parts)
    
    def _generate_netcdf_text(self, chunk: Dict, metadata: Dict) -> str:
        """Generate text for netCDF chunk"""
        variables = chunk['data']
        chunk_meta = chunk['metadata']
        
        text_parts = []
        
        # Time range info
        if chunk_meta.get('time_range') == 'static':
            text_parts.append("This netCDF dataset contains static (non-temporal) data.")
        else:
            text_parts.append(
                f"This netCDF dataset covers time steps {chunk_meta['time_start']+1} "
                f"to {chunk_meta['time_end']} ({chunk_meta['time_steps']} steps)."
            )
        
        # Variables info
        text_parts.append(f"Available variables: {', '.join(chunk_meta['variables'])}.")
        
        # Variable details
        for var_name, var_info in list(variables.items())[:3]:  # First 3 variables
            text_parts.append(
                f"{var_name} has dimensions {var_info['dimensions']}, "
                f"units: {var_info.get('units', 'unknown')}."
            )
        
        # Global attributes
        if metadata.get('global_attributes'):
            attrs = metadata['global_attributes']
            if 'title' in attrs:
                text_parts.append(f"Dataset title: {attrs['title']}.")
            if 'institution' in attrs:
                text_parts.append(f"Source: {attrs['institution']}.")
        
        return ' '.join(text_parts)
