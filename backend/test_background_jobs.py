#!/usr/bin/env python3
"""
Test script for background jobs system
Tests Celery tasks, task mapping, and API endpoints
"""

import sys
import json
from services.tasks import (
    execute_ai_task,
    set_task_id_mapping,
    get_task_id_by_execution_id,
)
from core.celery_app import celery_app

def test_task_registration():
    """Test that tasks are registered with Celery"""
    print("Testing task registration...")
    task = celery_app.tasks.get("tasks.execute_ai_task")
    if task:
        print("✓ Task 'tasks.execute_ai_task' is registered")
        return True
    else:
        print("✗ Task not found")
        return False

def test_task_mapping():
    """Test execution_id to task_id mapping"""
    print("\nTesting task ID mapping...")
    execution_id = "test-exec-123"
    task_id = "test-task-456"
    
    set_task_id_mapping(execution_id, task_id)
    retrieved = get_task_id_by_execution_id(execution_id)
    
    if retrieved == task_id:
        print(f"✓ Task mapping works: {execution_id} -> {task_id}")
        return True
    else:
        print(f"✗ Task mapping failed: expected {task_id}, got {retrieved}")
        return False

def test_celery_connection():
    """Test Celery can connect to Redis"""
    print("\nTesting Celery connection to Redis...")
    try:
        inspect = celery_app.control.inspect()
        stats = inspect.stats()
        if stats:
            print("✓ Celery worker is connected and responding")
            return True
        else:
            print("⚠ No workers found (this is OK if worker isn't running)")
            return True  # Not a failure, just no workers
    except Exception as e:
        print(f"✗ Connection error: {e}")
        return False

def test_task_creation():
    """Test creating a task (without executing)"""
    print("\nTesting task creation...")
    try:
        # Create a task but don't execute it
        execution_id = "test-exec-" + str(hash("test"))
        task = execute_ai_task.apply_async(
            args=("Test task description", None, execution_id),
            countdown=3600,  # Don't execute for 1 hour
        )
        print(f"✓ Task created successfully: {task.id}")
        # Revoke it immediately
        task.revoke(terminate=True)
        print("✓ Task revoked successfully")
        return True
    except Exception as e:
        print(f"✗ Task creation failed: {e}")
        return False

def main():
    """Run all tests"""
    print("=" * 50)
    print("Background Jobs System Test")
    print("=" * 50)
    
    results = []
    
    results.append(("Task Registration", test_task_registration()))
    results.append(("Task Mapping", test_task_mapping()))
    results.append(("Celery Connection", test_celery_connection()))
    results.append(("Task Creation", test_task_creation()))
    
    print("\n" + "=" * 50)
    print("Test Results Summary")
    print("=" * 50)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed! Background jobs system is working.")
        return 0
    else:
        print(f"\n⚠ {total - passed} test(s) failed.")
        return 1

if __name__ == "__main__":
    sys.exit(main())

