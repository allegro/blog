#!/bin/bash

path=$(dirname "$0")

# exit with error when something goes wrong
set -e

while [ -n "$1" ];do
    case "$1" in 
        --file-to-check|-f)
            files_to_check="$files_to_check $2";
            shift 2;;
        --setx|-x)
            set -xv;
            shift;;
        -h|--help)
            echo "usage: $0 [-x|--setx]  [ [--file-to-check FILE|-f FILE] ... ]"
            echo ""
            echo "  --file-to-check | -f .... can be specified multiple times "
            echo "  --setx | -x  - turn on bash 'debug mode'. Warning, very, very verbose"
            exit 0;;
        *)
            echo "unknown parameter '$1'"
            exit 1;;
    esac
done

if [ -z "$files_to_check" ];then
    files_to_check=$(git diff --name-only --diff-filter=AMC origin/main..HEAD | grep _posts) || true
fi

if test -z "$files_to_check"
then
    echo 1>&2 "No files to check. Remember to commit changes."
    exit 0
else
    files_to_check_by_linter=$(echo "$files_to_check" | sed "s~$~ -c $path/.markdownlint.json~")
    linter_errors=$(echo "$files_to_check_by_linter" | xargs npx markdownlint-cli 2>&1 | sed "s~^./~~" | tail -n +2)

    all_errors=()

    if test ! -z "$linter_errors"
    then
        all_errors+=( "$linter_errors" )
    fi

    authors=$(echo "$files_to_check" | xargs cat | grep "author:" | grep -E "[a-z0-9-]+\.[a-z0-9-]+(\.[a-z0-9-]+)?" -o)
    authors_images=$(echo "$authors" | sed "s~^~$path/img/authors/~" | sed "s/$/.jpg/")

    for image in $authors_images; do
        if test ! -f "$image"
        then
            all_errors+=( "$image No authors image" ) 
        fi
    done

    for author in $authors; do
        author_page=$(echo "$author" | sed "s~^~$path/authors/~" | sed "s~$~/index.md~")
        
        if test ! -f "$author_page"
        then
            all_errors+=( "$author_page No author page" )
        else
            author_page_content=$(cat $author_page)
            
            author_page_layout=$(echo "$author_page_content" | grep -w "layout: author")
            if test -z "$author_page_layout"; then
                all_errors+=( "$author_page Wrong author page layout" )
            fi

            author_page_author=$(echo "$author_page_content" | grep -w "author: $author")
            if test -z "$author_page_author"; then
                all_errors+=( "$author_page Wrong page author" )
            fi
        fi
    done

    errors_content="$( printf "\n%s" "${all_errors[@]}" | tail -n +2)"
fi

if test -z "$errors_content" 
then
    echo 1>&2 "No issues found."
    exit 0
else
    echo 1>&2 "$errors_content"
    exit 1
fi
