#!/usr/bin/env ruby
#coding: utf-8
require 'nokogiri'
require 'json'
require_relative 'acronym_generator'

class Indexer
  attr_accessor :authors
  attr_accessor :indices

  def initialize
    @ag = AcronymGenerator.new
    titles = open('titles.txt').read.split("\n").map { |l| t, id = l.split; [t, id.to_i] }
    ta = (0..titles.max_by { |_, id| id }[1]).map { [] }
    titles.each { |t, id|
      ta[id] << @ag.generate(t)
    }
    ta.map! { |t| t.join('|') }
    @title_acronyms = ta
    @indices = []
    @authors = {}
  end

  def de_punctuate str
    str.gsub(/[。、？]/u, '')
  end

  def count_chars lines
    de_punctuate((0..lines.size).step(2).map { |i| lines[i] }.join).size
  end

  #def purify_metre line
  #  line.gsub(/[^　○●◎⊙□■◇◆]/u,'')
  #end

  def get_category lines
    cat = nil
    (1..lines.size).step(2).map { |i| lines[i] }.each { |l|
      l.strip.split(/　|協/).each { |sentence|
        last_char = sentence[-1]
        case last_char #平P,仄Z,換H,協X
          when '□'
            cat = (cat && (cat == 'Z'|| cat == 'H')) ? 'H' : 'P'
          when '■'
            cat = (cat && (cat == 'P'||cat == 'H')) ? 'H' : 'Z'
          when '◇', '◆'
            cat = 'X'
          else
            next
        end
      }
      break if cat == 'X'
    }
    cat
  end

  def collect_info doc, id
    doc = Nokogiri::HTML.parse(doc)
    titles = @title_acronyms[id]
    entry = []

    doc.css('pre').each_with_index { |pre, idx|
      lines = pre.text.split
      author = pre.previous_element.text.strip
      @authors[author] = @authors.fetch(author, []) << id if id
      entry << "#{count_chars(lines)}#{get_category(lines)}"
    }
    @indices << [titles, entry.join]
  end

  def sort!
    @authors = @authors
    .each { |k, ids| ids.uniq!; ids.sort! }
    .map { |k, v| [@ag.generate(k)].concat(v) }
  end
end

if __FILE__ == $0
  open("../js/indices.js", "w") do |fo|
    indexer = Indexer.new
    Dir.glob("../data/a*.html").sort_by { |fn| File.basename(fn)[1..-1].to_i }.each do |fname|
      id = File.basename(fname)[1..-1].to_i
      indexer.collect_info(open(fname), id)
    end
    indexer.sort!

    info = {
        authors: indexer.authors,
        indices: indexer.indices
    }
    fo.write("module.exports=#{JSON::generate(info)};")
  end
end
