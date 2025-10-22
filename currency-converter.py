#!/usr/bin/env python3
"""
Script to replace dollar signs with Ghanaian cedi signs in HTML files
For FIBERSPINES - Ghana-based company
"""

import os
import re

def replace_dollar_with_cedi(file_path):
    """
    Replace all dollar signs ($) with Ghanaian cedi signs (₵) in a file
    """
    try:
        # Read the file content
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Replace dollar signs with cedi signs
        # Using regex to handle both standalone $ and prices like $89.99
        new_content = re.sub(r'\$(\d+(?:\.\d{2})?)', r'₵\1', content)
        
        # Also replace any remaining standalone dollar signs
        new_content = new_content.replace('$', '₵')
        
        # Write the updated content back to the file
        with open(file_path, 'w', encoding='utf-8') as file:
            file.write(new_content)
        
        print(f"✅ Successfully updated {file_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error processing {file_path}: {e}")
        return False

def find_html_files(directory='.'):
    """
    Find all HTML files in the given directory and subdirectories
    """
    html_files = []
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.html'):
                html_files.append(os.path.join(root, file))
    return html_files

def main():
    """
    Main function to run the currency replacement
    """
    print("🇬🇭 FIBERSPINES - Currency Converter")
    print("Converting $ to ₵ in HTML files...\n")
    
    # Get current directory
    current_dir = os.getcwd()
    print(f"Working directory: {current_dir}")
    
    # Find all HTML files
    html_files = find_html_files(current_dir)
    
    if not html_files:
        print("❌ No HTML files found in the current directory.")
        return
    
    print(f"Found {len(html_files)} HTML file(s):")
    for file in html_files:
        print(f"  - {file}")
    
    print("\n" + "="*50)
    
    # Process each HTML file
    success_count = 0
    for file_path in html_files:
        if replace_dollar_with_cedi(file_path):
            success_count += 1
    
    print("\n" + "="*50)
    print(f"🎉 Conversion completed!")
    print(f"✅ Successfully updated: {success_count}/{len(html_files)} files")
    print(f"🇬🇭 All dollar signs have been converted to Ghanaian cedi signs (₵)")

def preview_changes(file_path):
    """
    Preview what changes will be made without actually modifying the file
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        # Find all dollar amounts
        dollar_pattern = r'\$(\d+(?:\.\d{2})?)'
        dollar_matches = re.findall(dollar_pattern, content)
        
        if dollar_matches:
            print(f"💰 Dollar amounts found in {file_path}:")
            for match in dollar_matches:
                print(f"  ${match} → ₵{match}")
        else:
            print(f"ℹ️  No dollar amounts found in {file_path}")
            
        # Count total dollar signs
        total_dollars = content.count('$')
        if total_dollars > 0:
            print(f"📊 Total $ signs found: {total_dollars}")
        else:
            print("📊 No $ signs found")
            
    except Exception as e:
        print(f"❌ Error reading {file_path}: {e}")

if __name__ == "__main__":
    # You can run this script in different ways:
    
    # Option 1: Run directly to convert all HTML files
    main()
    
    # Option 2: Uncomment below to preview changes first
    # print("🔍 Preview mode - showing changes without modifying files:")
    # html_files = find_html_files()
    # for file in html_files:
    #     preview_changes(file)